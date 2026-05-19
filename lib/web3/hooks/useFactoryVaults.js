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
import { formatUsdc } from "@/lib/web3/utils";

/**
 * Load all vault addresses from factory + optional status snapshot.
 */
export function useFactoryVaults() {
  const query = useQuery({
    queryKey: ["factoryVaults", FACTORY_ADDRESS],
    enabled: Boolean(FACTORY_ADDRESS),
    staleTime: 60_000,
    queryFn: async () => {
      const addresses = await readContract(wagmiConfig, {
        address: FACTORY_ADDRESS,
        abi: KATANGA_FACTORY_ABI,
        functionName: "getAllVaults",
      });

      const vaults = await Promise.all(
        addresses.map(async (address) => {
          try {
            const status = await readContract(wagmiConfig, {
              address,
              abi: KATANGA_VAULT_ABI,
              functionName: "getVaultStatus",
            });
            return {
              address,
              vaultName: status[0],
              organiser: status[1],
              isActive: Boolean(status[2]),
              currentRound: Number(status[3] ?? 1),
              totalRounds: Number(status[4] ?? 0),
              contributionAmount: status[5] ?? 0n,
              contributionFormatted: formatUsdc(status[5] ?? 0n),
              memberCount: Number(status[6] ?? 0),
              roundRecipient: status[7],
              roundApprovals: Number(status[8] ?? 0),
              roundDisbursed: Boolean(status[9]),
              usdcBalance: status[10] ?? 0n,
            };
          } catch {
            return {
              address,
              vaultName: "Vault",
              organiser: null,
              isActive: false,
              currentRound: 0,
              totalRounds: 0,
              contributionAmount: 0n,
              contributionFormatted: "0.00 USDC",
              memberCount: 0,
              error: true,
            };
          }
        }),
      );

      return vaults;
    },
  });

  const vaults = useMemo(() => query.data ?? [], [query.data]);

  return {
    vaults,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isConfigured: Boolean(FACTORY_ADDRESS),
  };
}
