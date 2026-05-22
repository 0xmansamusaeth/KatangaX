"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Bell, Wallet } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { DashboardVaultCard } from "@/components/dashboard/DashboardVaultCard";
import { UpcomingPaymentItem } from "@/components/dashboard/UpcomingPaymentItem";
import { FloatingNewVaultButton } from "@/components/dashboard/FloatingNewVaultButton";
import { PullIndicator } from "@/components/dashboard/PullIndicator";
import { GuestDashboard } from "@/components/dashboard/GuestDashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMounted } from "@/hooks/useMounted";
import { useNotifications } from "@/hooks/useNotifications";
import { usePayments } from "@/hooks/usePayments";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import { formatDate, getTimeBasedGreeting } from "@/lib/utils";

function sumTotalSaved(vaults) {
  return vaults.reduce((sum, v) => {
    const hist = v.contributionHistory ?? [];
    return (
      sum +
      hist.reduce((s, h) => s + (Number(h.totalCollected) || 0), 0)
    );
  }, 0);
}

function nextPayoutFromVaults(vaults) {
  const active = vaults.filter((v) => v.status === "active");
  if (!active.length) {
    return { amount: 0, vaultName: "—" };
  }
  const v = active[0];
  return {
    amount: v.contributionAmount * v.memberCount,
    vaultName: v.name,
  };
}

function minDueDateForVault(vaultId, payments) {
  const pending = payments.filter(
    (p) => p.vaultId === vaultId && p.status !== "paid",
  );
  if (!pending.length) return null;
  return pending
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate;
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard();
  const { user } = useUser();
  const { vaults, refetch: refetchVaults, loading: vaultsLoading } = useVaults();
  const { payments, refetch: refetchPayments } = usePayments();
  const { unreadCount, refetch: refetchNotifications } = useNotifications();
  const mounted = useMounted();

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchVaults(),
      refetchPayments(),
      refetchNotifications(),
    ]);
    toast("Up to date", { duration: 1500 });
  }, [refetchVaults, refetchPayments, refetchNotifications]);

  const { pull, refreshing, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const totalSaved = useMemo(() => sumTotalSaved(vaults), [vaults]);
  const { amount: nextPayoutAmount, vaultName: nextPayoutVaultName } =
    useMemo(() => nextPayoutFromVaults(vaults), [vaults]);
  const activeVaultCount = useMemo(
    () => vaults.filter((v) => v.status === "active").length,
    [vaults],
  );

  const upcomingPayments = useMemo(() => {
    const open = payments.filter((p) => p.status !== "paid");
    return open
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
  }, [payments]);

  const vaultColorById = useMemo(() => {
    const map = {};
    vaults.forEach((v) => {
      const first = v.members?.[0];
      map[v.id] = first?.avatarColor ?? "#1B5E20";
    });
    return map;
  }, [vaults]);

  const vaultDueChipById = useMemo(() => {
    const map = {};
    vaults.forEach((v) => {
      const d = minDueDateForVault(v.id, payments);
      map[v.id] = d
        ? formatDate(d, { day: "numeric", month: "short" })
        : null;
    });
    return map;
  }, [vaults, payments]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7F5]" />
    );
  }

  if (!isAuthenticated) {
    return <GuestDashboard />;
  }

  const firstName = (user.name || "there").split(" ")[0];
  // `getTimeBasedGreeting` reads `new Date().getHours()`, which differs
  // between the SSR (UTC) host and the user's local browser. Defer to
  // post-mount so the first paint is deterministic.
  const greeting = mounted
    ? getTimeBasedGreeting(firstName)
    : `Hi, ${firstName} 👋`;

  return (
    <PageWrapper>
      <PullIndicator pull={pull} refreshing={refreshing} threshold={threshold} />
      <div
        style={{
          transform: pull > 0 ? `translateY(${Math.min(pull, threshold)}px)` : undefined,
          transition:
            pull === 0
              ? "transform 220ms ease-out"
              : refreshing
              ? "transform 200ms ease-out"
              : "none",
        }}
      >
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold leading-snug text-[#1A1A1A]">
          {greeting}
        </h1>
        <Link
          href="/notifications"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#1A1A1A] transition-colors hover:bg-white/80"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-6 w-6" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="mt-6">
        <DashboardSummaryCards
          totalSaved={totalSaved}
          nextPayoutAmount={nextPayoutAmount}
          nextPayoutVaultName={nextPayoutVaultName}
          activeVaultCount={activeVaultCount}
          currency={user.currency}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1A1A1A]">My Vaults</h2>
        <Link
          href="/vaults"
          className="text-sm font-medium text-[#1B5E20] hover:underline"
        >
          See all
        </Link>
      </div>

      <div className="mt-3 -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {!mounted ? (
          <>
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                className="h-[168px] w-[260px] shrink-0 rounded-2xl"
              />
            ))}
          </>
        ) : vaults.length === 0 ? (
          <div className="w-full">
            <EmptyState
              icon={Wallet}
              title="Start your first Vault"
              description="Create a savings circle with people you trust and let KatangaX handle the rotation."
              actionLabel="Create a Vault"
              actionHref="/vaults/new"
            />
          </div>
        ) : (
          vaults.map((v) => (
            <DashboardVaultCard
              key={v.id}
              vault={v}
              nextDueDate={vaultDueChipById[v.id]}
            />
          ))
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-[#1A1A1A]">
          Upcoming Payments
        </h2>
        <div className="mt-3 space-y-3">
          {!mounted ? (
            <>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
              ))}
            </>
          ) : upcomingPayments.length === 0 ? (
            <EmptyState
              emoji="🎉"
              title="You’re all caught up"
              description="No outstanding contributions across your vaults."
            />
          ) : (
            upcomingPayments.map((p) => (
              <UpcomingPaymentItem
                key={p.id}
                payment={p}
                vaultColor={vaultColorById[p.vaultId]}
                currency={user.currency}
              />
            ))
          )}
        </div>
      </div>

      <FloatingNewVaultButton />
      </div>
    </PageWrapper>
  );
}
