"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionHistory } from "@/lib/web3/hooks/useTransactionHistory";
import { basescanTxUrl } from "@/lib/web3/utils";
import { formatDate } from "@/lib/utils";

const ICONS = {
  contribution: { Icon: ArrowUp, className: "text-[#16A34A] bg-[#16A34A]/10" },
  payout: { Icon: Trophy, className: "text-[#D97706] bg-[#FFFBEB]" },
  approval: { Icon: CheckCircle2, className: "text-[#2563EB] bg-[#EFF6FF]" },
  round_advanced: {
    Icon: ArrowRight,
    className: "text-[#6B7280] bg-[#F3F4F6]",
  },
};

/**
 * @param {{ vault: { contractAddress?: string, members?: any[] } }} props
 */
export function OnChainHistoryList({ vault }) {
  const { events, isLoading, isError, retry, isFetching } = useTransactionHistory(
    vault.contractAddress,
    { members: vault.members },
  );

  if (isLoading) {
    return (
      <ul className="space-y-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Skeleton className="h-20 w-full rounded-2xl" />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-6 text-center">
        <p className="text-sm font-medium text-[#DC2626]">
          Could not load blockchain data.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1B5E20]"
        >
          <RefreshCw className="h-4 w-4" />
          Retry →
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#1A1A1A]">
          No on-chain activity yet
        </p>
        <p className="mt-1 text-xs text-[#6B7280]">
          Contributions and payouts will appear here from Base mainnet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isFetching ? (
        <p className="text-center text-[11px] text-[#6B7280]">Refreshing…</p>
      ) : null}
      <ul className="space-y-3">
        {events.map((e) => {
          const meta = ICONS[e.type] ?? ICONS.round_advanced;
          const Icon = meta.Icon;
          const when = e.blockTimestamp
            ? formatDate(new Date(e.blockTimestamp * 1000), {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";

          return (
            <li
              key={e.id}
              className="rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <div
                  className={
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
                    meta.className
                  }
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {e.description}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Round {e.round} · {when}
                  </p>
                  {e.txHash ? (
                    <Link
                      href={basescanTxUrl(e.txHash) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-[#1B5E20]"
                    >
                      View tx →
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
