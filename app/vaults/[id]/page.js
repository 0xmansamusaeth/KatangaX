"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Calendar } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CircularProgressRing } from "@/components/vaults/CircularProgressRing";
import { HistoryTab } from "@/components/vaults/HistoryTab";
import { OrganiserActions } from "@/components/vaults/OrganiserActions";
import { OverviewTab } from "@/components/vaults/OverviewTab";
import { RulesTab } from "@/components/vaults/RulesTab";
import { VaultDetailTabs } from "@/components/vaults/VaultDetailTabs";
import { useMounted } from "@/hooks/useMounted";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import {
  formatCurrency,
  formatDate,
  getPeriodLabel,
  getRoundDateRange,
} from "@/lib/utils";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "history", label: "History" },
  { value: "rules", label: "Rules" },
];

export default function VaultDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { vaults } = useVaults();
  const { user } = useUser();
  const [tab, setTab] = useState("overview");
  const mounted = useMounted();

  const vault = useMemo(
    () => vaults.find((v) => v.id === id),
    [vaults, id],
  );

  // Before hydration we only have seed vaults; a user-created vault
  // (stored only in localStorage) won't be visible yet. Show a skeleton
  // until the client has merged in saved state.
  if (!mounted) {
    return (
      <PageWrapper title="" showBack>
        <div className="flex flex-col items-center pt-2">
          <Skeleton className="h-44 w-44 rounded-full" />
          <Skeleton className="mt-4 h-4 w-40" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="mt-6 h-10 w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </PageWrapper>
    );
  }

  if (!vault) {
    return (
      <PageWrapper title="Vault not found" showBack>
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFFBEB] text-[#92400E]">
            <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 text-base font-semibold text-[#1A1A1A]">
            We couldn’t find this vault
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            It may have been removed, or the link is from another device.
          </p>
          <Button className="mt-5 w-full rounded-xl" asChild>
            <Link href="/vaults">Back to my vaults</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const pct =
    vault.totalRounds > 0
      ? Math.round((vault.currentRound / vault.totalRounds) * 100)
      : 0;
  const pot = vault.contributionAmount * vault.memberCount;
  const userIsOrganiser = vault.members?.some(
    (m) => m.userId === user.id && m.id === vault.organiserId,
  );

  const nextRange = getRoundDateRange(vault, vault.currentRound);
  const nextPayoutDate = nextRange?.end
    ? formatDate(nextRange.end, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const statusBadge =
    vault.status === "active"
      ? { label: "Active", className: "bg-[#16A34A]/15 text-[#166534]" }
      : vault.status === "completed"
        ? { label: "Completed", className: "bg-[#F3F4F6] text-[#4B5563]" }
        : { label: vault.status, className: "bg-[#FFFBEB] text-[#92400E]" };

  return (
    <PageWrapper
      title={vault.name}
      showBack
      showSettings
      settingsHref={`/vaults/${vault.id}/edit`}
    >
      <section className="-mx-4 flex flex-col items-center bg-gradient-to-b from-[#1B5E20]/[0.06] to-transparent px-4 pb-6 pt-4">
        <CircularProgressRing value={pct}>
          <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">
            Round
          </p>
          <p className="text-3xl font-bold leading-none text-[#1A1A1A]">
            {vault.currentRound}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">of {vault.totalRounds}</p>
        </CircularProgressRing>

        <p className="mt-4 text-sm font-semibold text-[#1A1A1A]">
          {formatCurrency(pot)} pot this round
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
          {nextPayoutDate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#4B5563] shadow-sm">
              <Calendar className="h-3 w-3" />
              Next payout {nextPayoutDate}
            </span>
          ) : null}
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#4B5563] shadow-sm">
            {formatCurrency(vault.contributionAmount)} ·{" "}
            {getPeriodLabel(vault.contributionPeriod)}
          </span>
        </div>
      </section>

      <VaultDetailTabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="pt-4">
        {tab === "overview" ? <OverviewTab vault={vault} /> : null}
        {tab === "history" ? <HistoryTab vault={vault} /> : null}
        {tab === "rules" ? <RulesTab vault={vault} /> : null}
      </div>

      {userIsOrganiser ? <OrganiserActions vault={vault} /> : null}
    </PageWrapper>
  );
}
