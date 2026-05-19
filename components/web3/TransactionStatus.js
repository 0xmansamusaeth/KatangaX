"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { basescanTxUrl } from "@/lib/web3/utils";

/**
 * @param {{
 *   status: 'idle'|'pending'|'success'|'error',
 *   txHash?: string,
 *   message?: string,
 *   gasEstimateWei?: bigint,
 *   onRetry?: () => void,
 * }} props
 */
export function TransactionStatus({
  status,
  txHash,
  message,
  gasEstimateWei,
  onRetry,
}) {
  if (status === "idle") return null;

  const explorer = basescanTxUrl(txHash);

  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (status === "success"
          ? "border-[#16A34A]/30 bg-[#16A34A]/10"
          : status === "error"
            ? "border-[#DC2626]/30 bg-[#DC2626]/10"
            : "border-border bg-white")
      }
    >
      {status === "pending" && (
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#1B5E20]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#1A1A1A]">
              {message ?? "Transaction pending on Base…"}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              Usually confirms in under a minute.
            </p>
            {gasEstimateWei != null && gasEstimateWei > 0n ? (
              <p className="mt-2 text-[11px] text-[#6B7280]">
                Est. gas fee: ~{(Number(gasEstimateWei) / 1e18).toFixed(6)} ETH
              </p>
            ) : null}
          </div>
        </div>
      )}
      {status === "success" && (
        <motionlessSuccess message={message} explorer={explorer} />
      )}
      {status === "error" && (
        <motionlessError message={message} onRetry={onRetry} />
      )}
    </div>
  );
}

function motionlessSuccess({ message, explorer }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#166534]">
          {message ?? "Transaction confirmed"}
        </p>
        {explorer ? (
          <Link
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-semibold text-[#1B5E20] underline"
          >
            View on Basescan →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function motionlessError({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3">
      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#DC2626]">
          {message ?? "Transaction failed"}
        </p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onRetry}
          >
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
