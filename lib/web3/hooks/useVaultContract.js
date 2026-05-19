"use client";

import { useReadContract, useReadContracts } from "wagmi";
import {
  KATANGA_VAULT_ABI,
  MIN_DISBURSEMENT_APPROVALS,
} from "@/lib/web3/contracts";
import { formatUsdc } from "@/lib/web3/utils";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";

/**
 * @param {string|undefined} vaultAddress On-chain vault contract
 */
export function useVaultContract(vaultAddress) {
  const { address: walletAddress, isBase, isConnected } = useWalletConnection();
  const enabled = Boolean(vaultAddress && isConnected && isBase);

  const { data: status, refetch: refetchStatus } = useReadContract({
    address: vaultAddress,
    abi: KATANGA_VAULT_ABI,
    functionName: "getVaultStatus",
    query: { enabled },
  });

  const currentRound = status?.[3] ? Number(status[3]) : 1;

  const { data: memberStatus, refetch: refetchMember } = useReadContract({
    address: vaultAddress,
    abi: KATANGA_VAULT_ABI,
    functionName: "getMemberStatus",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: enabled && Boolean(walletAddress) },
  });

  const { data: roundInfo, refetch: refetchRound } = useReadContract({
    address: vaultAddress,
    abi: KATANGA_VAULT_ABI,
    functionName: "getRoundInfo",
    args: [BigInt(currentRound)],
    query: { enabled },
  });

  const { data: disbursementHash, refetch: refetchHash } = useReadContract({
    address: vaultAddress,
    abi: KATANGA_VAULT_ABI,
    functionName: "getDisbursementHash",
    args: [BigInt(currentRound)],
    query: { enabled },
  });

  const vaultName = status?.[0] ?? "";
  const isActive = status?.[2] ?? false;
  const totalRounds = status?.[4] ? Number(status[4]) : 0;
  const contributionAmount = status?.[5] ?? 0n;
  const memberCount = status?.[6] ? Number(status[6]) : 0;
  const roundRecipient = status?.[7];
  const roundApprovals = status?.[8] ? Number(status[8]) : 0;
  const roundDisbursed = status?.[9] ?? false;
  const contractUsdcBalance = status?.[10] ?? 0n;

  const paidThisRound = memberStatus?.[1] ?? false;
  const hasApprovedRound = memberStatus?.[4] ?? false;
  const disbursementReady =
    disbursementHash &&
    disbursementHash !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  return {
    status,
    vaultName,
    isActive,
    currentRound,
    totalRounds,
    contributionAmount,
    contributionFormatted: formatUsdc(contributionAmount),
    memberCount,
    roundRecipient,
    roundApprovals,
    roundDisbursed,
    contractUsdcBalance,
    contractBalanceFormatted: formatUsdc(contractUsdcBalance),
    memberStatus,
    paidThisRound,
    hasApprovedRound,
    roundInfo,
    disbursementHash,
    disbursementReady,
    minApprovals: MIN_DISBURSEMENT_APPROVALS,
    refetch: () => {
      refetchStatus();
      refetchMember();
      refetchRound();
      refetchHash();
    },
  };
}
