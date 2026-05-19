import { getAddress, isAddress } from "viem";
import { basePublicClient } from "@/lib/web3/publicClient";

/**
 * @param {string} input
 * @returns {Promise<{ ok: boolean, address?: `0x${string}`, error?: string, ensName?: string }>}
 */
export async function resolveWalletInput(input) {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, error: "Enter a wallet address" };

  if (raw.endsWith(".eth")) {
    try {
      const resolved = await basePublicClient.getEnsAddress({ name: raw });
      if (!resolved) {
        return { ok: false, error: "Could not resolve ENS name" };
      }
      return {
        ok: true,
        address: getAddress(resolved),
        ensName: raw,
      };
    } catch {
      return { ok: false, error: "ENS lookup failed" };
    }
  }

  if (!isAddress(raw, { strict: false })) {
    return { ok: false, error: "Invalid Ethereum address" };
  }

  try {
    return { ok: true, address: getAddress(raw) };
  } catch {
    return { ok: false, error: "Invalid address checksum" };
  }
}

/**
 * @param {`0x${string}`} organiser
 * @param {{ walletAddress: string }[]} added
 * @param {number} memberCount
 */
export function buildUsdcMemberWalletList(organiser, added, memberCount) {
  const list = [organiser];
  for (const m of added) {
    if (list.length >= memberCount) break;
    if (m.walletAddress) list.push(m.walletAddress);
  }
  return list.slice(0, memberCount);
}

/**
 * @param {`0x${string}`} organiser
 * @param {{ walletAddress: string }[]} added
 */
export function organiserIncludedInMembers(organiser, added) {
  const o = organiser.toLowerCase();
  return added.some((m) => m.walletAddress?.toLowerCase() === o);
}
