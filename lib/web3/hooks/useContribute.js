"use client";

import { useCallback, useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  KATANGA_VAULT_ABI,
  USDC_ABI,
  USDC_ADDRESS,
} from "@/lib/web3/contracts";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { useUSDCAllowance } from "@/lib/web3/hooks/useUSDCAllowance";
import { parseWeb3Error, toastWeb3Error } from "@/lib/web3/errors";

/**
 * @param {string|undefined} vaultAddress
 * @param {bigint|undefined} amount Atomic USDC
 */
export function useContribute(vaultAddress, amount) {
  const { address, isBase } = useWalletConnection();
  const [step, setStep] = useState("idle");
  const [txHash, setTxHash] = useState(/** @type {string|undefined} */ (undefined));
  const [error, setError] = useState(/** @type {string|null} */ (null));

  const { allowance, needsApproval, refetch: refetchAllowance } =
    useUSDCAllowance(vaultAddress);

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess && step === "approving") {
      setStep("approved");
      refetchAllowance();
    }
  }, [isSuccess, step, refetchAllowance]);

  const reset = useCallback(() => {
    setStep("idle");
    setTxHash(undefined);
    setError(null);
  }, []);

  const approve = useCallback(async () => {
    if (!vaultAddress || !amount || !address) {
      setError("Connect your wallet on Base first.");
      return;
    }
    setError(null);
    setStep("approving");
    try {
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [vaultAddress, amount],
      });
      setTxHash(hash);
      await refetchAllowance();
      setStep("approved");
      return hash;
    } catch (e) {
      setStep("error");
      const msg = parseWeb3Error(e);
      setError(msg);
      toastWeb3Error(e);
      throw e;
    }
  }, [address, amount, vaultAddress, writeContractAsync, refetchAllowance]);

  const contribute = useCallback(async () => {
    if (!vaultAddress) {
      setError("Vault contract not found.");
      return;
    }
    setError(null);
    setStep("contributing");
    try {
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: KATANGA_VAULT_ABI,
        functionName: "contribute",
      });
      setTxHash(hash);
      setStep("success");
      return hash;
    } catch (e) {
      setStep("error");
      const msg = parseWeb3Error(e);
      setError(msg);
      toastWeb3Error(e);
      throw e;
    }
  }, [vaultAddress, writeContractAsync]);

  const status =
    isConfirming || isWriting
      ? "pending"
      : isSuccess && step === "success"
        ? "success"
        : step === "error"
          ? "error"
          : step === "idle"
            ? "idle"
            : "pending";

  const needsApprovalAmount =
    amount != null ? needsApproval(amount) : true;

  return {
    step,
    status,
    txHash,
    error,
    needsApproval: needsApprovalAmount,
    allowance,
    approve,
    contribute,
    reset,
    isWriting,
    isConfirming,
    isSuccess,
  };
}
