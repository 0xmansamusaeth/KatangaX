"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEstimateGas, useBalance } from "wagmi";
import { formatGasEstimate, fetchEthUsdPrice, MIN_ETH_FOR_GAS } from "@/lib/web3/gas";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";

/**
 * @param {{
 *   enabled?: boolean,
 *   to?: `0x${string}`,
 *   data?: `0x${string}`,
 *   value?: bigint,
 * }} params
 */
export function useGasEstimate({ enabled = true, to, data, value }) {
  const { address, isConnected, isBase } = useWalletConnection();

  const gasQuery = useEstimateGas({
    to,
    data,
    value,
    account: address,
    query: {
      enabled: Boolean(enabled && isConnected && isBase && address && to && data),
    },
  });

  const { data: balance } = useBalance({
    address,
    query: { enabled: Boolean(enabled && address && isConnected) },
  });

  const priceQuery = useQuery({
    queryKey: ["ethUsdPrice"],
    queryFn: fetchEthUsdPrice,
    staleTime: 60_000,
    enabled: Boolean(enabled && isConnected),
  });

  const formatted = useMemo(() => {
    if (!gasQuery.data) return null;
    return formatGasEstimate(gasQuery.data, priceQuery.data ?? null);
  }, [gasQuery.data, priceQuery.data]);

  const hasInsufficientEth = useMemo(() => {
    if (!balance?.value || !gasQuery.data) return false;
    return balance.value < gasQuery.data || balance.value < MIN_ETH_FOR_GAS;
  }, [balance?.value, gasQuery.data]);

  return {
    gasWei: gasQuery.data,
    formatted,
    ethBalance: balance?.value,
    hasInsufficientEth,
    isLoading: gasQuery.isLoading || priceQuery.isLoading,
    error: gasQuery.error,
    refetch: gasQuery.refetch,
  };
}
