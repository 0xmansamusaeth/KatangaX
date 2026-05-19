"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { useWalletOnChainActivity } from "@/lib/web3/hooks/useWalletOnChainActivity";
import { formatUsdc, basescanTxUrl } from "@/lib/web3/utils";
import { cn, formatDate } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "contribution", label: "Contributions" },
  { value: "payout", label: "Payouts" },
];

export function OnChainPaymentsTab() {
  const { isConnected } = useWalletConnection();
  const [filter, setFilter] = useState("all");
  const {
    events,
    vaultCount,
    totalContributed,
    totalReceived,
    isLoading,
    isConfigured,
  } = useWalletOnChainActivity();

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "contribution") {
      return events.filter((e) => e.type === "contribution");
    }
    return events.filter((e) => e.type === "payout");
  }, [events, filter]);

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#1A1A1A]">
          Connect your Base wallet to see on-chain activity
        </p>
        <div className="mt-4">
          <ConnectWalletButton />
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <p className="text-center text-sm text-[#6B7280]">
        Factory contract not configured. Set NEXT_PUBLIC_FACTORY_ADDRESS.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-xs text-[#6B7280]">On-chain summary</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] uppercase text-[#6B7280]">Contributed</p>
            <p className="font-bold text-[#1A1A1A]">
              {formatUsdc(totalContributed)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-[#6B7280]">Received</p>
            <p className="font-bold text-[#1B5E20]">
              {formatUsdc(totalReceived)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">
          Across {vaultCount} vault{vaultCount === 1 ? "" : "s"} on Base
        </p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              filter === f.value
                ? "border-[#1B5E20] bg-[#1B5E20] text-white"
                : "border-border bg-white text-[#4B5563]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">
          No on-chain payments found for your wallet yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => {
            const isPayout = e.type === "payout";
            const Icon = isPayout ? ArrowDown : ArrowUp;
            const when = e.blockTimestamp
              ? formatDate(new Date(e.blockTimestamp * 1000), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            return (
              <li
                key={e.id}
                className="rounded-xl border border-border bg-white p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                      (isPayout
                        ? "bg-[#FFFBEB] text-[#D97706]"
                        : "bg-[#16A34A]/10 text-[#16A34A]")
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      {e.vaultName ?? "Vault"}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      Round {e.round} · {isPayout ? "Payout" : "Contribution"} ·{" "}
                      {when}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#1B5E20]">
                      {e.amountFormatted}
                    </p>
                    {e.txHash ? (
                      <Link
                        href={basescanTxUrl(e.txHash) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-[#1B5E20]"
                      >
                        View on Basescan →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
