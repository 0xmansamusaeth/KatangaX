import { toast } from "@/components/ui/toast";

/**
 * Map wallet / contract errors to user-friendly copy.
 * @param {unknown} error
 * @returns {string}
 */
export function parseWeb3Error(error) {
  const msg =
    error?.shortMessage ??
    error?.details ??
    error?.message ??
    (typeof error === "string" ? error : "");
  const lower = String(msg).toLowerCase();
  const reason = error?.cause?.reason ?? error?.reason ?? "";

  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request")
  ) {
    return "Transaction cancelled";
  }
  if (
    lower.includes("insufficient funds for gas") ||
    lower.includes("insufficient funds for intrinsic") ||
    (lower.includes("insufficient") && lower.includes("gas"))
  ) {
    return "You need a small amount of ETH on Base for gas fees (~$0.01)";
  }
  if (
    lower.includes("insufficient") &&
    (lower.includes("usdc") || lower.includes("transfer amount exceeds"))
  ) {
    return "Not enough USDC. Top up your wallet first.";
  }
  if (lower.includes("alreadypaidthisround")) {
    return "You've already contributed this round";
  }
  if (lower.includes("notmember")) {
    return "Your wallet is not a member of this vault";
  }
  if (
    lower.includes("disbursementnotready") ||
    lower.includes("roundnotfunded")
  ) {
    return "All members must contribute before disbursement";
  }
  if (lower.includes("wrong network") || lower.includes("chain mismatch")) {
    return "Switch to Base mainnet in your wallet";
  }
  if (
    lower.includes("timeout") ||
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("econnreset")
  ) {
    return "Could not reach Base network. Check your connection.";
  }
  if (reason) {
    return `Transaction failed: ${reason}`;
  }
  if (lower.includes("revert")) {
    const match = msg.match(/reverted with reason string '([^']+)'/i);
    if (match?.[1]) return `Transaction failed: ${match[1]}`;
    return "Transaction failed. Please try again.";
  }
  return msg || "Something went wrong. Please try again.";
}

/**
 * @param {unknown} error
 * @param {{ duration?: number }} [options]
 */
export function toastWeb3Error(error, options = {}) {
  toast(parseWeb3Error(error), {
    variant: "error",
    duration: options.duration ?? 5000,
  });
}
