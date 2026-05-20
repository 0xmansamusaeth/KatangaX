/** Tiny sessionStorage-backed registry for in-flight on-chain transactions.
 * Used by TransactionRecovery to surface pending/dropped/reverted txs after
 * a page reload, and by action handlers to block duplicates. */

const STORAGE_KEY = "katangax.pendingTx.v1";

/**
 * @typedef {{
 *   key: string,
 *   action: "contribute" | "approve" | "sign_disbursement",
 *   vaultId?: string,
 *   contractAddress?: string,
 *   roundNumber?: number,
 *   disbursementId?: string,
 *   profileId?: string,
 *   txHash: `0x${string}`,
 *   startedAt: number,
 * }} PendingTx
 */

function readAll() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function makePendingKey({ vaultId, action, roundNumber, disbursementId }) {
  if (action === "sign_disbursement") {
    return `pending_tx_${vaultId ?? "x"}_sign_${disbursementId ?? roundNumber ?? "0"}`;
  }
  return `pending_tx_${vaultId ?? "x"}_${action}_${roundNumber ?? "0"}`;
}

export function listPendingTx() {
  return readAll();
}

export function getPendingTx(key) {
  return readAll().find((tx) => tx.key === key) ?? null;
}

export function addPendingTx(entry) {
  const list = readAll().filter((tx) => tx.key !== entry.key);
  list.push({ ...entry, startedAt: Date.now() });
  writeAll(list);
}

export function removePendingTx(key) {
  writeAll(readAll().filter((tx) => tx.key !== key));
}

export function removePendingByTxHash(txHash) {
  const lower = String(txHash ?? "").toLowerCase();
  writeAll(readAll().filter((tx) => tx.txHash.toLowerCase() !== lower));
}

export function clearPendingTx() {
  writeAll([]);
}
