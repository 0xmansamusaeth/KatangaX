"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { StickyTabs } from "@/components/ui/sticky-tabs";
import { PaymentDueCard } from "@/components/payments/PaymentDueCard";
import { PaymentHistoryRow } from "@/components/payments/PaymentHistoryRow";
import { useMounted } from "@/hooks/useMounted";
import { usePayments } from "@/hooks/usePayments";
import { cn, formatUSDC } from "@/lib/utils";

const TABS = [
  { value: "due", label: "Due" },
  { value: "history", label: "History" },
];

const HISTORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "contribution", label: "Contributions" },
  { value: "payout", label: "Payouts Received" },
];

export default function PaymentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("due");
  const [filter, setFilter] = useState("all");

  const { due, history, totals, loading } = usePayments();
  const mounted = useMounted();

  const filteredHistory = useMemo(() => {
    if (filter === "all") return history;
    if (filter === "contribution")
      return history.filter((h) => h.kind === "contribution");
    return history.filter((h) => h.kind === "payout");
  }, [history, filter]);

  const onPay = (dueItem) => {
    router.push(`/vaults/${dueItem.vaultId}`);
  };

  return (
    <PageWrapper title="Payments">
      <StickyTabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="pt-4">
        {tab === "due" ? (
          <DueTab items={due} onPay={onPay} ready={mounted && !loading} />
        ) : (
          <HistoryTab
            items={filteredHistory}
            filter={filter}
            onFilterChange={setFilter}
            totals={totals}
            ready={mounted && !loading}
          />
        )}
      </div>
    </PageWrapper>
  );
}

function DueTab({ items, onPay, ready }) {
  if (!ready) {
    return (
      <ul className="space-y-3" aria-hidden>
        {[0, 1].map((i) => (
          <li
            key={i}
            className="h-[136px] animate-pulse rounded-2xl bg-[#F1F3F4]"
          />
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="🎉"
        title="You're all caught up!"
        description="No outstanding contributions across your vaults. Nice work."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.id}>
          <PaymentDueCard item={it} onPay={() => onPay(it)} />
        </li>
      ))}
    </ul>
  );
}

function HistoryTab({ items, filter, onFilterChange, totals, ready }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatBox
          label="Total Contributed"
          value={formatUSDC(totals.contributed)}
          tone="muted"
        />
        <StatBox
          label="Total Received"
          value={formatUSDC(totals.received)}
          tone="accent"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {HISTORY_FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-[#1B5E20] bg-[#1B5E20] text-white"
                  : "border-border bg-white text-[#4B5563]",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {!ready ? (
        <ul className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-[68px] animate-pulse rounded-xl bg-[#F1F3F4]"
            />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No history yet"
          description="Once contributions and payouts complete, they'll appear here."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <PaymentHistoryRow key={it.id} item={it} />
          ))}
        </ul>
      )}
    </div>
  );
}

function StatBox({ label, value, tone = "muted" }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold leading-tight",
          tone === "accent" ? "text-[#1B5E20]" : "text-[#1A1A1A]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
