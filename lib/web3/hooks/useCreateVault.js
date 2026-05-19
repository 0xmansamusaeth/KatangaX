"use client";

import { useCallback, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { decodeEventLog } from "viem";
import {
  FACTORY_ADDRESS,
  KATANGA_FACTORY_ABI,
} from "@/lib/web3/contracts";
import { parseWeb3Error, toastWeb3Error } from "@/lib/web3/errors";

/**
 * @param {{
 *   vaultName: string,
 *   members: `0x${string}`[],
 *   contributionAmount: bigint,
 *   roundDurationDays: number,
 * }} params
 */
export function useCreateVault() {
  const [txHash, setTxHash] = useState(/** @type {string|undefined} */ (undefined));
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [vaultAddress, setVaultAddress] = useState(
    /** @type {string|undefined} */ (undefined),
  );

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const createVault = useCallback(
    async ({ vaultName, members, contributionAmount, roundDurationDays }) => {
      if (!FACTORY_ADDRESS) {
        const msg =
          "Factory contract not configured. Set NEXT_PUBLIC_FACTORY_ADDRESS.";
        setError(msg);
        throw new Error(msg);
      }
      if (members.length < 3 || members.length > 20) {
        const msg = "Vault requires 3–20 member wallets.";
        setError(msg);
        throw new Error(msg);
      }

      setError(null);
      setVaultAddress(undefined);

      try {
        const hash = await writeContractAsync({
          address: FACTORY_ADDRESS,
          abi: KATANGA_FACTORY_ABI,
          functionName: "createVault",
          args: [
            vaultName,
            members,
            contributionAmount,
            BigInt(roundDurationDays),
          ],
        });
        setTxHash(hash);
        return hash;
      } catch (e) {
        const msg = parseWeb3Error(e);
        setError(msg);
        toastWeb3Error(e);
        throw e;
      }
    },
    [writeContractAsync],
  );

  const resolveVaultFromReceipt = useCallback(() => {
    if (!receipt?.logs || vaultAddress) return vaultAddress;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: KATANGA_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "VaultCreated") {
          const addr = decoded.args.vault;
          setVaultAddress(addr);
          return addr;
        }
      } catch {
        /* not our event */
      }
    }
    return undefined;
  }, [receipt, vaultAddress]);

  const status =
    isWriting || isConfirming
      ? "pending"
      : isSuccess
        ? "success"
        : error
          ? "error"
          : "idle";

  return {
    createVault,
    txHash,
    error,
    status,
    isWriting,
    isConfirming,
    isSuccess,
    receipt,
    vaultAddress,
    resolveVaultFromReceipt,
  };
}
