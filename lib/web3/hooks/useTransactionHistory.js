"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enrichEventLabels,
  fetchVaultChainEvents,
} from "@/lib/web3/eventLogs";

/**
 * @param {string|undefined} vaultContractAddress
 * @param {{ members?: { id: string, name?: string, walletAddress?: string }[], enabled?: boolean }} [options]
 */
export function useTransactionHistory(vaultContractAddress, options = {}) {
  const { members = [], enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["vaultTxHistory", vaultContractAddress],
    enabled: Boolean(vaultContractAddress && enabled),
    staleTime: 15_000,
    queryFn: () => fetchVaultChainEvents(vaultContractAddress),
  });

  const events = useMemo(
    () => enrichEventLabels(query.data ?? [], members),
    [query.data, members],
  );

  const retry = useCallback(async () => {
    if (!vaultContractAddress) return;
    const data = await fetchVaultChainEvents(vaultContractAddress, {
      force: true,
    });
    queryClient.setQueryData(
      ["vaultTxHistory", vaultContractAddress],
      data,
    );
  }, [queryClient, vaultContractAddress]);

  return {
    events,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    retry,
  };
}
