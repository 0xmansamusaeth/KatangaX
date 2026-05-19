"use client";

import { useReadContracts } from "wagmi";
import { KATANGA_VAULT_ABI } from "@/lib/web3/contracts";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";

/**
 * @param {string|undefined} vaultAddress
 * @param {{ walletAddress?: string }[]} members
 */
export function useMemberApprovals(vaultAddress, members = []) {
  const { isConnected, isBase } = useWalletConnection();
  const wallets = members
    .map((m) => m.walletAddress)
    .filter((a) => a && a.startsWith("0x"));

  const { data, refetch, isLoading } = useReadContracts({
    contracts: wallets.map((addr) => ({
      address: vaultAddress,
      abi: KATANGA_VAULT_ABI,
      functionName: "getMemberStatus",
      args: [addr],
    })),
    query: {
      enabled: Boolean(vaultAddress && isConnected && isBase && wallets.length),
    },
  });

  const approvedByWallet = new Map();
  wallets.forEach((addr, i) => {
    const row = data?.[i]?.result;
    if (row) {
      approvedByWallet.set(addr.toLowerCase(), Boolean(row[4]));
    }
  });

  return { approvedByWallet, refetch, isLoading };
}
