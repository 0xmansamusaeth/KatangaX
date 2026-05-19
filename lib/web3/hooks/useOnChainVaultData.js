"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KATANGA_VAULT_ABI } from "@/lib/web3/contracts";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { formatUsdc } from "@/lib/web3/utils";

const POLL_MS = 30_000;
const STALE_MS = 60_000;

/**
 * @param {string|undefined} vaultContractAddress
 */
export function useOnChainVaultData(vaultContractAddress) {
  const { address: walletAddress, isConnected, isBase } = useWalletConnection();
  const enabled = Boolean(vaultContractAddress);

  const query = useQuery({
    queryKey: ["onChainVault", vaultContractAddress, walletAddress],
    enabled,
    refetchInterval: POLL_MS,
    queryFn: async () => {
      const { readContract } = await import("wagmi/actions");
      const { wagmiConfig } = await import("@/lib/web3/config");

      const status = await readContract(wagmiConfig, {
        address: vaultContractAddress,
        abi: KATANGA_VAULT_ABI,
        functionName: "getVaultStatus",
      });

      const currentRound = Number(status[3] ?? 1);

      const [roundInfo, memberStatus] = await Promise.all([
        readContract(wagmiConfig, {
          address: vaultContractAddress,
          abi: KATANGA_VAULT_ABI,
          functionName: "getRoundInfo",
          args: [BigInt(currentRound)],
        }),
        walletAddress
          ? readContract(wagmiConfig, {
              address: vaultContractAddress,
              abi: KATANGA_VAULT_ABI,
              functionName: "getMemberStatus",
              args: [walletAddress],
            })
          : Promise.resolve(null),
      ]);

      return {
        fetchedAt: Date.now(),
        status,
        roundInfo,
        memberStatus,
        currentRound,
      };
    },
  });

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  const data = query.data;
  const status = data?.status;

  const structured = useMemo(() => {
    if (!status) return null;
    const contributionAmount = status[5] ?? 0n;
    const memberCount = Number(status[6] ?? 0);
    const roundInfo = data?.roundInfo;

    return {
      vaultName: status[0] ?? "",
      organiser: status[1],
      isActive: Boolean(status[2]),
      currentRound: Number(status[3] ?? 1),
      totalRounds: Number(status[4] ?? 0),
      contributionAmount,
      contributionFormatted: formatUsdc(contributionAmount),
      memberCount,
      roundRecipient: status[7],
      roundApprovals: Number(status[8] ?? 0),
      roundDisbursed: Boolean(status[9]),
      usdcBalance: status[10] ?? 0n,
      usdcBalanceFormatted: formatUsdc(status[10] ?? 0n),
      round: roundInfo
        ? {
            recipient: roundInfo[0],
            amount: roundInfo[1],
            amountFormatted: formatUsdc(roundInfo[1] ?? 0n),
            disbursed: Boolean(roundInfo[2]),
            approvalCount: Number(roundInfo[3] ?? 0),
            disbursementHash: roundInfo[4],
          }
        : null,
      member: data?.memberStatus
        ? {
            isMember: Boolean(data.memberStatus[0]),
            paidThisRound: Boolean(data.memberStatus[1]),
            hasReceivedPayout: Boolean(data.memberStatus[2]),
            totalContributed: data.memberStatus[3] ?? 0n,
            totalContributedFormatted: formatUsdc(data.memberStatus[3] ?? 0n),
            approvedCurrentRound: Boolean(data.memberStatus[4]),
          }
        : null,
      potFormatted: formatUsdc(contributionAmount * BigInt(memberCount || 0)),
    };
  }, [status, data?.roundInfo, data?.memberStatus]);

  const fetchedAt = data?.fetchedAt ?? 0;
  const isStale =
    fetchedAt > 0 && Date.now() - fetchedAt > STALE_MS && !query.isFetching;

  return {
    ...structured,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isStale,
    fetchedAt,
    refetch,
  };
}
