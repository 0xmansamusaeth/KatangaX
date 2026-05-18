import { getSeedState } from "@/lib/mockData";

const STORAGE_KEY = "katangax:state";

/**
 * Deep merge notifications by id — saved fields win (preserves read state, etc.).
 * @param {any[]} seed
 * @param {any[]} saved
 */
function mergeNotifications(seed, saved) {
  const savedById = new Map((saved ?? []).map((n) => [n.id, n]));
  return (seed ?? []).map((s) => {
    const prev = savedById.get(s.id);
    if (!prev) return s;
    return { ...s, ...prev };
  });
}

/**
 * Merge vaults by id — user-saved snapshot wins on overlapping keys; seed fills new fields.
 * @param {any[]} seed
 * @param {any[]} saved
 */
function mergeVaults(seed, saved) {
  const savedById = new Map((saved ?? []).map((v) => [v.id, v]));
  const merged = (seed ?? []).map((sVault) => {
    const savedVault = savedById.get(sVault.id);
    if (!savedVault) return sVault;
    return {
      ...sVault,
      ...savedVault,
      contributionHistory:
        savedVault.contributionHistory ?? sVault.contributionHistory,
      paymentStatusesByRound: {
        ...(sVault.paymentStatusesByRound ?? {}),
        ...(savedVault.paymentStatusesByRound ?? {}),
      },
      members:
        Array.isArray(savedVault.members) && savedVault.members.length
          ? savedVault.members.map((sm, i) => ({
              ...(sVault.members?.[i] ?? {}),
              ...sm,
            }))
          : sVault.members,
    };
  });
  const seedIds = new Set((seed ?? []).map((v) => v.id));
  const extras = (saved ?? []).filter((v) => v?.id && !seedIds.has(v.id));
  return [...merged, ...extras];
}

/**
 * Merge payments by stable id; saved list wins length for same ids.
 * @param {any[]} seed
 * @param {any[]} saved
 */
function mergePayments(seed, saved) {
  const savedById = new Map((saved ?? []).map((p) => [p.id, p]));
  const mergedSeed = (seed ?? []).map((p) => {
    const prev = savedById.get(p.id);
    return prev ? { ...p, ...prev } : p;
  });
  const seedIds = new Set((seed ?? []).map((p) => p.id));
  const extras = (saved ?? []).filter((p) => p?.id && !seedIds.has(p.id));
  return [...mergedSeed, ...extras];
}

function mergeState(seed, saved) {
  if (!saved) return structuredClone(seed);
  return {
    schemaVersion: seed.schemaVersion ?? saved.schemaVersion ?? 1,
    user: { ...(seed.user ?? {}), ...(saved.user ?? {}) },
    vaults: mergeVaults(seed.vaults, saved.vaults),
    notifications: mergeNotifications(seed.notifications, saved.notifications),
    payments: mergePayments(seed.payments, saved.payments),
  };
}

// Tracks whether the last read recovered from corrupt persistence.
// Read once by the StoreInit client component to surface a toast.
let lastRecoveryReason = null;
export function consumeStoreRecovery() {
  const r = lastRecoveryReason;
  lastRecoveryReason = null;
  return r;
}

function readRaw() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    // Corrupt JSON — drop the saved blob and recover with the seed.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    lastRecoveryReason = "parse";
    return null;
  }
}

function writeRaw(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (err) {
    // Quota exceeded, private-mode lockout, serialization failure — drop
    // the write silently so the in-memory state remains usable.
    if (typeof console !== "undefined") {
      console.warn("[KatangaX] Failed to persist state:", err);
    }
  }
}

/**
 * Full app state snapshot (seed shape + user edits).
 */
export function getState() {
  const seed = getSeedState();
  let saved = readRaw();
  try {
    return mergeState(seed, saved);
  } catch (err) {
    // Saved blob has unexpected shape — wipe and recover.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    lastRecoveryReason = "shape";
    return structuredClone(seed);
  }
}

/**
 * Replace entire persisted state.
 * @param {ReturnType<typeof getSeedState>} next
 */
export function setState(next) {
  writeRaw(next);
  dispatchStoreEvent();
}

/**
 * Patch top-level keys with a shallow merge helper callback.
 * @param {(prev: ReturnType<typeof getState>) => ReturnType<typeof getState>} updater
 */
export function updateState(updater) {
  const prev = getState();
  const next = updater(prev);
  writeRaw(next);
  dispatchStoreEvent();
}

const EVENT = "katangax:storage";

function dispatchStoreEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribe(listener) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Reset persisted data to merged seed (useful in dev).
 */
export function resetToSeed() {
  const seed = getSeedState();
  writeRaw(seed);
  dispatchStoreEvent();
}
