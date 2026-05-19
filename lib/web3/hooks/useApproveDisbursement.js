"use client";

import { useCallback, useState } from "react";
import { useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { KATANGA_VAULT_ABI } from "@/lib/web3/contracts";
import { parseWeb3Error, toastWeb3Error } from "@/lib/web3/errors";

/**
 * @param {string|undefined} vaultAddress
 * @param {number} round
 * @param {`0x${string}`|undefined} disbursementHash
 */
export function useApproveDisbursement(vaultAddress, round, disbursementHash) {
  const [txHash, setTxHash] = useState(/** @type {string|undefined} */ (undefined));
  const [error, setError] = useState(/** @type {string|null} */ (null));

  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const approve = useCallback(async () => {
    if (!vaultAddress || !disbursementHash || round < 1) {
      setError("Disbursement is not ready yet.");
      return;
    }
    setError(null);
    try {
      const signature = await signMessageAsync({
        message: { raw: disbursementHash },
      });
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: KATANGA_VAULT_ABI,
        functionName: "approveDisbursement",
        args: [BigInt(round), signature],
      });
      setTxHash(hash);
      return hash;
    } catch (e) {
      const msg = parseWeb3Error(e);
      setError(msg);
      toastWeb3Error(e);
      throw e;
    }
  }, [
    disbursementHash,
    round,
    signMessageAsync,
    vaultAddress,
    writeContractAsync,
  ]);

  const status = isSigning || isWriting || isConfirming
    ? "pending"
    : isSuccess
      ? "success"
      : error
        ? "error"
        : "idle";

  return {
    approve,
    txHash,
    error,
    status,
    isSigning,
    isWriting,
    isConfirming,
    isSuccess,
  };
}
