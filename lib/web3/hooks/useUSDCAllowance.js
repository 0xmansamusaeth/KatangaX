"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { USDC_ABI, USDC_ADDRESS } from "@/lib/web3/contracts";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";

/**
 * @param {string|undefined} spender Vault contract address
 */
export function useUSDCAllowance(spender) {
  const { address, isBase, isConnected } = useWalletConnection();

  const { data: allowance, refetch, isLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    query: {
      enabled: Boolean(address && spender && isConnected && isBase),
    },
  });

  const needsApproval = useMemo(
    () => (amount) => {
      if (amount == null || allowance == null) return true;
      return allowance < amount;
    },
    [allowance],
  );

  return {
    allowance: allowance ?? 0n,
    needsApproval,
    refetch,
    isLoading,
  };
}
