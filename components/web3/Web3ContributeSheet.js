"use client";

import { useEffect, useMemo, useState } from "react";
import { encodeFunctionData } from "viem";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { GasEstimateCard } from "@/components/web3/GasEstimateCard";
import { TransactionStatus } from "@/components/web3/TransactionStatus";
import { TxReviewCard } from "@/components/web3/TxReviewCard";
import { UsdcOnrampSheet } from "@/components/web3/UsdcOnrampSheet";
import { useContribute } from "@/lib/web3/hooks/useContribute";
import { useGasEstimate } from "@/lib/web3/hooks/useGasEstimate";
import { useUSDCBalance } from "@/lib/web3/hooks/useUSDCBalance";
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
  const { balance: usdcBalance } = useUSDCBalance();
  const [onrampOpen, setOnrampOpen] = useState(false);

  const amount = useMemo(
    () => parseUsdc(String(vault.contributionAmount ?? 0)),
    [vault.contributionAmount],
  );

  const insufficientUsdc =
    usdcBalance != null && amount > 0n && usdcBalance < amount;

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

  const txData = useMemo(() => {
    if (!address) return undefined;
    if (uiStep === "approve") {
      return encodeFunctionData({
        abi: USDC_ABI,
        functionName: "approve",
        args: [vault.contractAddress, amount],
      });
    }
    return encodeFunctionData({
      abi: KATANGA_VAULT_ABI,
      functionName: "contribute",
    });
  }, [address, uiStep, vault.contractAddress, amount]);

  const gas = useGasEstimate({
    enabled: open && isConnected && isBase,
    to: uiStep === "approve" ? USDC_ADDRESS : vault.contractAddress,
    data: txData,
  });

  useEffect(() => {
    if (isSuccess && step === "success") {
      onSuccess?.();
    }
  }, [isSuccess, step, onSuccess]);

  const disabled = !isConnected || !isBase || insufficientUsdc;
  const actionLabel =
    uiStep === "approve" ? "Approve USDC" : "Contribute";

  const handlePrimary = async () => {
    if (uiStep === "approve") await approve();
    else await contribute();
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={() => {
          reset();
          onClose();
        }}
        title={
          uiStep === "approve"
            ? "Approve USDC spending"
            : "Confirm contribution"
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#F5F7F5] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Vault
            </p>
            <p className="text-base font-semibold text-[#1A1A1A]">
              {vault.name}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">
              {formatUsdc(amount)}
            </p>
            <p className="text-xs text-[#6B7280]">
              Round {vault.currentRound} of {vault.totalRounds}
            </p>
          </div>

          <TxReviewCard
            action={actionLabel}
            vaultName={vault.name}
            amountLabel={formatUsdc(amount)}
            gasFormatted={gas.formatted}
          />

          <GasEstimateCard
            formatted={gas.formatted}
            isLoading={gas.isLoading}
            hasInsufficientEth={gas.hasInsufficientEth}
          />

          {insufficientUsdc ? (
            <div className="rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-3 text-sm">
              <p className="font-medium text-[#DC2626]">
                Insufficient USDC balance
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setOnrampOpen(true)}
              >
                Get USDC
              </Button>
            </div>
          ) : null}

          {uiStep === "approve" ? (
            <p className="text-sm text-[#6B7280]">
              First, approve KatangaX to use your USDC for this contribution.
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
            onRetry={handlePrimary}
          />

          {error && status === "error" ? (
            <p className="text-xs text-[#DC2626]">{error}</p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={disabled || status === "pending"}
            onClick={handlePrimary}
          >
            {status === "pending"
              ? "Confirm in wallet…"
              : `Confirm in wallet → ${actionLabel}`}
          </Button>
        </div>
      </BottomSheet>

      <UsdcOnrampSheet
        open={onrampOpen}
        onClose={() => setOnrampOpen(false)}
        walletAddress={address}
      />
    </>
  );
}
