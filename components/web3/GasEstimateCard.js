"use client";

import Link from "next/link";
import { AlertTriangle, Fuel } from "lucide-react";
import { BASE_BRIDGE_URL } from "@/lib/web3/onramp";

/**
 * @param {{
 *   formatted: { ethLabel: string, usdLabel: string } | null,
 *   isLoading?: boolean,
 *   hasInsufficientEth?: boolean,
 * }} props
 */
export function GasEstimateCard({
  formatted,
  isLoading,
  hasInsufficientEth,
}) {
  if (isLoading && !formatted) {
    return (
      <div className="rounded-xl border border-border bg-[#F5F7F5] p-3 text-sm text-[#6B7280]">
        Estimating gas…
      </div>
    );
  }

  if (!formatted) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-[#F5F7F5] p-3">
        <Fuel className="mt-0.5 h-5 w-5 shrink-0 text-[#1B5E20]" />
        <div className="text-sm">
          <p className="font-medium text-[#1A1A1A]">
            Estimated gas fee: {formatted.usdLabel}
          </p>
          <p className="text-xs text-[#6B7280]">
            {formatted.ethLabel} ETH on Base
          </p>
        </div>
      </div>

      {hasInsufficientEth ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#FFC107]/50 bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">You need ~0.0001 ETH for gas</p>
            <Link
              href={BASE_BRIDGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-semibold text-[#1B5E20] underline"
            >
              Get ETH on Base →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
