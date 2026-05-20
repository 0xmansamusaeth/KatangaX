import { formatUnits, parseUnits, getAddress, keccak256, toBytes } from "viem";
import { USDC_DECIMALS } from "@/lib/web3/contracts";
import { baseMainnet } from "@/lib/web3/chains";

/**
 * @param {bigint|string|number} amount Atomic USDC (6 decimals)
 */
export function formatUsdc(amount) {
  try {
    const v = typeof amount === "bigint" ? amount : BigInt(amount ?? 0);
    return `${Number(formatUnits(v, USDC_DECIMALS)).toFixed(2)} USDC`;
  } catch {
    return "0.00 USDC";
  }
}

/**
 * @param {string|number} amount Human-readable USDC
 */
export function parseUsdc(amount) {
  return parseUnits(String(amount || "0"), USDC_DECIMALS);
}

/**
 * @param {string} [address]
 */
export function truncateAddress(address) {
  if (!address || address.length < 10) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Normalize an EVM address to its EIP-55 checksum form so values stored in
 * Supabase / used in `=` comparisons stay canonical. Returns `null` if the
 * input isn't a valid address.
 * @param {string|null|undefined} address
 */
export function checksumAddress(address) {
  if (!address || typeof address !== "string") return null;
  try {
    return getAddress(address);
  } catch {
    return null;
  }
}

/**
 * @param {string} [txHash]
 */
export function basescanTxUrl(txHash) {
  if (!txHash) return null;
  return `${baseMainnet.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * @param {string} [address]
 */
export function basescanAddressUrl(address) {
  if (!address) return null;
  return `${baseMainnet.blockExplorers.default.url}/address/${address}`;
}

/**
 * Deterministic demo wallet for members without an on-chain address (dev/demo).
 * @param {string} memberId
 */
export function demoMemberWallet(memberId) {
  const hash = keccak256(toBytes(`katangax-member:${memberId}`));
  return getAddress(`0x${hash.slice(26)}`);
}

/**
 * @param {'week'|'biweek'|'month'} frequency
 */
export function frequencyToRoundDays(frequency) {
  if (frequency === "week") return 7;
  if (frequency === "biweek") return 14;
  return 30;
}

/**
 * Build ordered wallet list for on-chain vault (organiser first).
 * @param {`0x${string}`} organiserAddress
 * @param {{ id: string }[]} addedMembers
 * @param {number} memberCount
 */
export function buildOnChainMemberAddresses(
  organiserAddress,
  addedMembers,
  memberCount,
) {
  const list = [organiserAddress];
  for (const m of addedMembers) {
    if (list.length >= memberCount) break;
    list.push(demoMemberWallet(m.id));
  }
  let pad = 0;
  while (list.length < memberCount) {
    list.push(demoMemberWallet(`slot-${list.length}-${pad}`));
    pad += 1;
  }
  return list.slice(0, memberCount);
}

/** Rough ZMW display for USDC amounts (demo rate). */
export function usdcToZmwEstimate(usdcAmount) {
  const n = Number(usdcAmount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 28);
}
