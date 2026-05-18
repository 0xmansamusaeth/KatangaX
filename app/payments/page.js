"use client";

import { useMemo, useState } from "react";
import { PartyPopper } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { StickyTabs } from "@/components/ui/sticky-tabs";
import { toast } from "@/components/ui/toast";
import { PaymentConfirmSheet } from "@/components/payments/PaymentConfirmSheet";
import { PaymentDueCard } from "@/components/payments/PaymentDueCard";
import { PaymentHistoryRow } from "@/components/payments/PaymentHistoryRow";
import { useMounted } from "@/hooks/useMounted";
import { usePayments } from "@/hooks/usePayments";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import {
  getDuePaymentsForUser,
  getHistoryForUser,
} from "@/lib/userActivity";
import { cn, formatCurrency } from "@/lib/utils";

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
  const [tab, setTab] = useState("due");
  const [filter, setFilter] = useState("all");
  const [activePayment, setActivePayment] = useState(null);

  const { vaults } = useVaults();
  const { payments } = usePayments();
  const { user } = useUser();
  const { markContribution } = useVaults();
  // `getDuePaymentsForUser` calls `new Date()` to determine overdue
  // ordering and per-row colors. Defer until the client mounts so
  // hydration matches.
  const mounted = useMounted();

  const due = useMemo(
    () => (mounted ? getDuePaymentsForUser(vaults, payments, user) : []),
    [mounted, vaults, payments, user],
  );

  const history = useMemo(
    () => getHistoryForUser(vaults, user),
    [vaults, user],
  );

  const filteredHistory = useMemo(() => {
    if (filter === "all") return history;
    if (filter === "contribution")
      return history.filter((h) => h.kind === "contribution");
    return history.filter((h) => h.kind === "payout");
  }, [history, filter]);

  const totals = useMemo(() => {
    return history.reduce(
      (acc, h) => {
        if (h.kind === "payout") acc.received += h.amount;
        else if (h.status !== "pending") acc.contributed += h.amount;
        return acc;
      },
      { contributed: 0, received: 0 },
    );
  }, [history]);

  const onPay = (dueItem) => {
    const vault = vaults.find((v) => v.id === dueItem.vaultId);
    if (!vault) return;
    setActivePayment({
      id: dueItem.id,
      vaultId: dueItem.vaultId,
      vaultName: dueItem.vaultName,
      memberId: dueItem.memberId,
      amount: dueItem.amount,
      round: dueItem.round,
      totalRounds: vault.totalRounds,
      contributionPeriod: vault.contributionPeriod,
    });
  };

  const confirmActivePayment = () => {
    if (!activePayment) return;
    markContribution(
      activePayment.vaultId,
      activePayment.memberId,
      activePayment.round,
      "paid",
    );
    setActivePayment(null);
    toast("Payment confirmed. Receipt sent.");
  };

  return (
    <PageWrapper title="Payments">
      <StickyTabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="pt-4">
        {tab === "due" ? (
          <DueTab items={due} onPay={onPay} ready={mounted} />
        ) : (
          <HistoryTab
            items={filteredHistory}
            filter={filter}
            onFilterChange={setFilter}
            totals={totals}
          />
        )}
      </div>

      <PaymentConfirmSheet
        isOpen={!!activePayment}
        onClose={() => setActivePayment(null)}
        payment={activePayment}
        onConfirm={confirmActivePayment}
      />
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
        title="You’re all caught up!"
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

function HistoryTab({ items, filter, onFilterChange, totals }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Total Contributed" value={formatCurrency(totals.contributed)} tone="muted" />
        <StatBox label="Total Received" value={formatCurrency(totals.received)} tone="accent" />
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

      {items.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No history yet"
          description="Once contributions and payouts complete, they’ll appear here."
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
