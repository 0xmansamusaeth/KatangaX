"use client";

import { useEffect, useMemo } from "react";
import { useEstimateGas } from "wagmi";
import { encodeFunctionData } from "viem";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TransactionStatus } from "@/components/web3/TransactionStatus";
import { useContribute } from "@/lib/web3/hooks/useContribute";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import {
  KATANGA_VAULT_ABI,
  USDC_ABI,
  USDC_ADDRESS,
} from "@/lib/web3/contracts";
import { formatUsdc, parseUsdc } from "@/lib/web3/utils";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   vault: { name: string, contractAddress: string, contributionAmount: number, currentRound: number, totalRounds: number },
 *   onSuccess?: () => void,
 * }} props
 */
export function Web3ContributeSheet({ open, onClose, vault, onSuccess }) {
  const { isConnected, isBase, address } = useWalletConnection();
  const amount = useMemo(
    () => parseUsdc(String(vault.contributionAmount ?? 0)),
    [vault.contributionAmount],
  );

  const {
    step,
    status,
    txHash,
    error,
    needsApproval,
    approve,
    contribute,
    reset,
    isConfirming,
    isSuccess,
  } = useContribute(vault.contractAddress, amount);

  const uiStep =
    step === "approved" || (!needsApproval && step === "idle")
      ? "contribute"
      : "approve";

  const { data: gasEstimate } = useEstimateGas({
    to: uiStep === "approve" ? USDC_ADDRESS : vault.contractAddress,
    data:
      uiStep === "approve" && address
        ? encodeFunctionData({
            abi: USDC_ABI,
            functionName: "approve",
            args: [vault.contractAddress, amount],
          })
        : encodeFunctionData({
            abi: KATANGA_VAULT_ABI,
            functionName: "contribute",
          }),
    account: address,
    query: {
      enabled: Boolean(open && isConnected && isBase && address),
    },
  });

  useEffect(() => {
    if (isSuccess && step === "success") {
      onSuccess?.();
    }
  }, [isSuccess, step, onSuccess]);

  const disabled = !isConnected || !isBase;

  const handleApprove = async () => {
    await approve();
  };

  const handleContribute = async () => {
    await contribute();
  };

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={uiStep === "approve" ? "Approve USDC spending" : "Confirm contribution"}
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-[#F5F7F5] p-4">
          <p className="text-xs uppercase tracking-wide text-[#6B7280]">Vault</p>
          <p className="text-base font-semibold text-[#1A1A1A]">{vault.name}</p>
          <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">
            {formatUsdc(amount)}
          </p>
          <p className="text-xs text-[#6B7280]">
            Round {vault.currentRound} of {vault.totalRounds}
          </p>
        </div>

        {uiStep === "approve" ? (
          <p className="text-sm text-[#6B7280]">
            First, approve KatangaX to use your USDC for this vault contribution.
          </p>
        ) : (
          <p className="text-sm text-[#6B7280]">
            Send your contribution to the vault on Base mainnet.
          </p>
        )}

        <TransactionStatus
          status={status === "idle" && isConfirming ? "pending" : status}
          txHash={txHash}
          message={
            uiStep === "approve" && status === "pending"
              ? "Approving USDC…"
              : status === "pending"
                ? "Sending to Base blockchain…"
                : undefined
          }
          gasEstimateWei={gasEstimate}
          onRetry={uiStep === "approve" ? handleApprove : handleContribute}
        />

        {error && status === "error" ? (
          <p className="text-xs text-[#DC2626]">{error}</p>
        ) : null}

        {uiStep === "approve" ? (
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={disabled || status === "pending"}
            onClick={handleApprove}
          >
            Approve {formatUsdc(amount)}
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={disabled || status === "pending"}
            onClick={handleContribute}
          >
            Contribute
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}
