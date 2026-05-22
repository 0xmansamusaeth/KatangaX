import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names (shadcn-style).
 * @param {...import("clsx").ClassValue} inputs
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Minimum vault contribution in USDC */
export const MIN_USDC_CONTRIBUTION = 0.1;

/**
 * Format any number as a USDC amount (e.g. "10.00 USDC", "0.5 USDC").
 * @param {number|string|null|undefined} amount
 */
export function formatUSDC(amount) {
  if (amount === null || amount === undefined) return "0.00 USDC";

  const num = parseFloat(amount);
  if (Number.isNaN(num)) return "0.00 USDC";

  const formatted =
    num < 1
      ? num.toFixed(6).replace(/\.?0+$/, "")
      : num.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  return `${formatted} USDC`;
}

/** Format for input fields (number only, no USDC suffix). */
export function formatUSDCInput(amount) {
  if (!amount && amount !== 0) return "";
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return "";
  return num.toString();
}

/** Convert USDC display amount to contract amount (6 decimals). */
export function toUSDCContractAmount(amount) {
  return Math.round(parseFloat(amount) * 1_000_000);
}

/** Convert contract amount (6 decimals) to human USDC number. */
export function fromUSDCContractAmount(amount) {
  const n = typeof amount === "bigint" ? Number(amount) : Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 1_000_000;
}

/**
 * @deprecated Use formatUSDC — kept for gradual migration; ignores currency/locale.
 * @param {number} amount
 */
export function formatCurrency(amount) {
  return formatUSDC(amount);
}

/**
 * @param {string|Date} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(value, options = {}) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (!d || Number.isNaN(d.getTime?.())) return "—";
  return new Intl.DateTimeFormat("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(d);
}

/**
 * @param {string} fullName
 */
export function getInitials(fullName) {
  if (!fullName || typeof fullName !== "string") return "?";
  const parts = fullName.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return `${a}${b}`.toUpperCase();
}

/**
 * @param {string} id
 */
export function shortId(id) {
  return id?.slice?.(0, 8) ?? "";
}

/**
 * @param {string} firstName
 */
export function getTimeBasedGreeting(firstName) {
  const hour = new Date().getHours();
  let part = "Good evening";
  if (hour < 12) part = "Good morning";
  else if (hour < 17) part = "Good afternoon";
  return `${part}, ${firstName} 👋`;
}

/**
 * Relative-time formatter ("just now", "3 hours ago", "Yesterday", "5 days ago").
 * Falls back to a short date for older timestamps.
 * @param {string|Date|number} value
 */
export function formatRelativeTime(value) {
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  if (!d || Number.isNaN(d.getTime?.())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return "soon";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86400000,
  );
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(d, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Bucket a timestamp into "today" | "week" | "earlier".
 * @param {string|Date} value
 */
export function getNotificationGroup(value) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (!d || Number.isNaN(d.getTime?.())) return "earlier";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - dDay.getTime()) / 86400000,
  );
  if (diffDays <= 0) return "today";
  if (diffDays < 7) return "week";
  return "earlier";
}

/**
 * @param {string} isoDateStr "YYYY-MM-DD"
 */
export function isDueDateOverdue(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== "string") return false;
  const p = isoDateStr.split("-").map(Number);
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return false;
  const due = new Date(p[0], p[1] - 1, p[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDay < today;
}

/**
 * Days between an overdue ISO date (YYYY-MM-DD) and today. Returns 0 if not overdue.
 * @param {string} isoDateStr
 */
export function daysOverdue(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== "string") return 0;
  const p = isoDateStr.split("-").map(Number);
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return 0;
  const due = new Date(p[0], p[1] - 1, p[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

/**
 * Days until a future ISO date (YYYY-MM-DD). Returns 0 if past/today.
 * @param {string} isoDateStr
 */
export function daysUntil(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== "string") return 0;
  const p = isoDateStr.split("-").map(Number);
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return 0;
  const due = new Date(p[0], p[1] - 1, p[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

/**
 * Deterministic trust score in [3.8, 5.0], one decimal.
 * @param {string} memberId
 */
export function getTrustScore(memberId) {
  let h = 0;
  for (const ch of String(memberId ?? "")) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return Math.round((3.8 + (h % 13) / 10) * 10) / 10;
}

/**
 * Human-friendly label for a vault contribution period.
 * @param {"week"|"biweek"|"month"|string} period
 */
export function getPeriodLabel(period) {
  if (period === "week") return "Weekly";
  if (period === "biweek") return "Bi-weekly";
  if (period === "month") return "Monthly";
  return period ?? "—";
}

/**
 * Today as YYYY-MM-DD (local).
 */
export function todayIsoDate() {
  return dateToIsoLocal(new Date());
}

/**
 * Format a Date as YYYY-MM-DD using the date's *local* components.
 * Stable across SSR/CSR for dates produced via `new Date(y, m-1, d)`
 * (unlike `toISOString().slice(0,10)` which is UTC-based and shifts
 * by a day across timezones).
 * @param {Date} d
 */
export function dateToIsoLocal(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compute start/end date of round N for a vault with a startDate + period.
 * Returns null if startDate missing/invalid.
 * @param {{startDate?: string, contributionPeriod?: string}} vault
 * @param {number} roundNum
 */
export function getRoundDateRange(vault, roundNum) {
  if (!vault?.startDate || roundNum < 1) return null;
  const parts = String(vault.startDate).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;

  const begin = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d);

  if (vault.contributionPeriod === "week") {
    begin.setDate(d + (roundNum - 1) * 7);
    end.setDate(d + roundNum * 7 - 1);
  } else if (vault.contributionPeriod === "biweek") {
    begin.setDate(d + (roundNum - 1) * 14);
    end.setDate(d + roundNum * 14 - 1);
  } else {
    begin.setMonth(m - 1 + (roundNum - 1));
    end.setMonth(m - 1 + roundNum);
    end.setDate(end.getDate() - 1);
  }
  return { begin, end };
}

/**
 * Member shown to the current user resolves "userId === user.id" entries
 * to the user's display name/avatar.
 * @param {{name?:string, initials?:string, avatarColor?:string, userId?:string}} member
 * @param {{id?:string, name?:string, avatarColor?:string}} [user]
 */
export function resolveMemberDisplay(member, user) {
  if (member?.userId && user?.id && member.userId === user.id) {
    return {
      name: user.name ?? member.name ?? "You",
      initials: getInitials(user.name ?? member.name ?? "You"),
      avatarColor: user.avatarColor ?? member.avatarColor ?? "#1B5E20",
      isYou: true,
    };
  }
  return {
    name: member?.name ?? "Member",
    initials: member?.initials ?? getInitials(member?.name ?? ""),
    avatarColor: member?.avatarColor ?? "#6B7280",
    isYou: false,
  };
}
