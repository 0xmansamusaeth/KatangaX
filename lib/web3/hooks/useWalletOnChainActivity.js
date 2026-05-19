"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import {
  FACTORY_ADDRESS,
  KATANGA_FACTORY_ABI,
  KATANGA_VAULT_ABI,
} from "@/lib/web3/contracts";
import { wagmiConfig } from "@/lib/web3/config";
import {
  fetchVaultChainEvents,
  filterEventsForWallet,
  enrichEventLabels,
} from "@/lib/web3/eventLogs";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";

/**
 * Aggregate on-chain contributions / payouts for connected wallet across member vaults.
 */
export function useWalletOnChainActivity() {
  const { address, isConnected, isBase } = useWalletConnection();

  const query = useQuery({
    queryKey: ["walletOnChainActivity", address],
    enabled: Boolean(address && isConnected && isBase && FACTORY_ADDRESS),
    staleTime: 30_000,
    queryFn: async () => {
      const vaultAddresses = await readContract(wagmiConfig, {
        address: FACTORY_ADDRESS,
        abi: KATANGA_FACTORY_ABI,
        functionName: "getVaultsByMember",
        args: [address],
      });

      const allEvents = [];
      for (const vaultAddress of vaultAddresses) {
        let vaultName = "Vault";
        try {
          const status = await readContract(wagmiConfig, {
            address: vaultAddress,
            abi: KATANGA_VAULT_ABI,
            functionName: "getVaultStatus",
          });
          vaultName = status[0] || vaultName;
        } catch {
          /* ignore */
        }
        const events = await fetchVaultChainEvents(vaultAddress);
        const walletEvents = filterEventsForWallet(events, address).map((e) => ({
          ...e,
          vaultAddress,
          vaultName,
        }));
        allEvents.push(...walletEvents);
      }

      allEvents.sort((a, b) => b.blockTimestamp - a.blockTimestamp);

      let totalContributed = 0n;
      let totalReceived = 0n;
      let txCount = 0;

      for (const e of allEvents) {
        txCount += 1;
        if (e.type === "contribution" && e.amount) {
          totalContributed += e.amount;
        }
        if (e.type === "payout" && e.amount) {
          totalReceived += e.amount;
        }
      }

      return {
        vaultCount: vaultAddresses.length,
        vaultAddresses,
        events: allEvents,
        totalContributed,
        totalReceived,
        txCount,
      };
    },
  });

  const events = useMemo(
    () => enrichEventLabels(query.data?.events ?? []),
    [query.data?.events],
  );

  return {
    vaultCount: query.data?.vaultCount ?? 0,
    events,
    recentEvents: events.slice(0, 5),
    totalContributed: query.data?.totalContributed ?? 0n,
    totalReceived: query.data?.totalReceived ?? 0n,
    txCount: query.data?.txCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    isConfigured: Boolean(FACTORY_ADDRESS),
  };
}
