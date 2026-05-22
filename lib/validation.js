import { isAddress } from "viem";

/** Strip HTML tags from a string and trim whitespace. */
export function sanitizeText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/<[^>]*>/g, "")
    .trim();
}

const VAULT_NAME_RE = /^[\p{L}\p{N}\s.,&'\-_]{2,60}$/u;

export function isValidVaultName(value) {
  return VAULT_NAME_RE.test(sanitizeText(value));
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function isValidUsername(value) {
  if (value == null) return false;
  return USERNAME_RE.test(String(value).trim());
}

export function normaliseUsername(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

const MAX_USDC = 1_000_000;
export const MIN_USDC = 0.1;
const AMOUNT_RE = /^\d+(?:\.\d{1,6})?$/;

/**
 * Validate a USDC amount as user input. Returns null on success or a string
 * error message.
 */
export function validateUsdcAmount(value) {
  const s = String(value ?? "").trim();
  if (!s) return "Amount is required";
  if (!AMOUNT_RE.test(s)) return "Use up to 6 decimal places";
  const n = Number(s);
  if (!Number.isFinite(n)) return "Amount must be a number";
  if (n < MIN_USDC) return `Minimum contribution is ${MIN_USDC} USDC`;
  if (n > MAX_USDC) return `Amount cannot exceed ${MAX_USDC.toLocaleString()} USDC`;
  return null;
}

export function isValidEvmAddress(value) {
  if (!value || typeof value !== "string") return false;
  return isAddress(value);
}

/** Strip HTML and cap a free-text length (e.g. feedback messages, rules). */
export function sanitizeMessage(value, max = 2000) {
  const cleaned = sanitizeText(value);
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max);
}

export const VALIDATION_LIMITS = Object.freeze({
  MIN_USDC,
  MAX_USDC,
  MAX_FEEDBACK_LENGTH: 2000,
  MAX_VAULT_NAME_LENGTH: 60,
});
