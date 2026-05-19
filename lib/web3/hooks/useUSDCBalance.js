"use client";

import { useReadContract } from "wagmi";
import { USDC_ABI, USDC_ADDRESS } from "@/lib/web3/contracts";
import { formatUsdc } from "@/lib/web3/utils";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";

/**
 * @param {string} [ownerAddress] Defaults to connected wallet
 */
export function useUSDCBalance(ownerAddress) {
  const { address, isConnected, isBase } = useWalletConnection();
  const account = ownerAddress ?? address;

  const { data, isLoading, isError, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: {
      enabled: Boolean(account && isConnected && isBase),
      refetchInterval: 15_000,
    },
  });

  const balance = data ?? 0n;
  const formatted = formatUsdc(balance);

  return {
    balance,
    formatted,
    isLoading,
    isError,
    refetch,
  };
}
