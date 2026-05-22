"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useVaults } from "@/hooks/useVaults";

/**
 * Combined payment state for the Payments page:
 *  - `due`: per-vault rows where the user has not yet contributed this round
 *  - `history`: merged contributions + disbursements for the user
 *  - `totals`: aggregate USD amounts
 *
 * Refetch is exposed for pull-to-refresh.
 */
export function usePayments() {
  const { profile, loading: profileLoading } = useProfile();
  const { vaults, loading: vaultsLoading, refetch: refetchVaults } = useVaults();
  const [activity, setActivity] = useState({
    contributions: [],
    disbursements: [],
    contributionsThisRound: {},
    loading: true,
  });

  const fetchActivity = useCallback(async () => {
    if (!profile?.id) {
      setActivity({ contributions: [], disbursements: [], contributionsThisRound: {}, loading: false });
      return;
    }
    const supabase = createClient();

    const [contribsRes, payoutsRes] = await Promise.all([
      supabase
        .from("contributions")
        .select("*, vaults!inner(id, name, total_rounds, contract_address, payment_method, current_round)")
        .eq("profile_id", profile.id)
        .order("contributed_at", { ascending: false }),
      supabase
        .from("disbursements")
        .select("*, vaults!inner(id, name, total_rounds, contract_address, payment_method)")
        .eq("recipient_id", profile.id)
        .eq("status", "disbursed")
        .order("disbursed_at", { ascending: false }),
    ]);

    // Cross-reference contributions for current round per vault membership.
    const vaultIds = vaults.map((v) => v.id).filter((id) => id && id.length === 36);
    let currentRoundContribs = [];
    if (vaultIds.length) {
      const orFilter = vaults
        .filter((v) => v.id && v.id.length === 36)
        .map((v) => `and(vault_id.eq.${v.id},round_number.eq.${v.currentRound})`)
        .join(",");
      if (orFilter) {
        const { data } = await supabase
          .from("contributions")
          .select("vault_id, round_number, profile_id")
          .eq("profile_id", profile.id)
          .or(orFilter);
        currentRoundContribs = data ?? [];
      }
    }
    const contributionsThisRound = {};
    for (const c of currentRoundContribs) {
      contributionsThisRound[`${c.vault_id}:${c.round_number}`] = true;
    }

    setActivity({
      contributions: contribsRes.data ?? [],
      disbursements: payoutsRes.data ?? [],
      contributionsThisRound,
      loading: false,
    });
  }, [profile?.id, vaults]);

  useEffect(() => {
    if (!vaultsLoading) fetchActivity();
  }, [fetchActivity, vaultsLoading]);

  const due = useMemo(() => {
    if (!profile?.id) return [];
    const items = [];
    for (const v of vaults) {
      if (v.status !== "active") continue;
      const myMember = v.members?.find(
        (m) => m.userId === profile.id || m.walletAddress === profile.walletAddress,
      );
      if (!myMember) continue;
      const key = `${v.id}:${v.currentRound}`;
      if (activity.contributionsThisRound[key]) continue;
      items.push({
        id: `${v.id}-r${v.currentRound}`,
        vaultId: v.id,
        vaultName: v.name,
        memberId: myMember.id,
        memberCount: v.memberCount,
        round: v.currentRound,
        amount: v.contributionAmount,
        currency: "USDC",
        dueDate: v.startDate || new Date().toISOString().slice(0, 10),
        overdueDays: 0,
      });
    }
    return items;
  }, [profile?.id, profile?.walletAddress, vaults, activity.contributionsThisRound]);

  const history = useMemo(() => {
    const items = [];
    for (const c of activity.contributions) {
      items.push({
        id: `c-${c.id}`,
        kind: "contribution",
        vaultId: c.vault_id,
        vaultName: c.vaults?.name ?? "Vault",
        round: c.round_number,
        totalRounds: c.vaults?.total_rounds ?? 0,
        amount: Number(c.amount ?? 0),
        date: c.contributed_at ?? c.created_at ?? null,
        status: c.status === "confirmed" ? "paid" : c.status,
        txHash: c.tx_hash ?? null,
        currency: "USDC",
      });
    }
    for (const d of activity.disbursements) {
      items.push({
        id: `d-${d.id}`,
        kind: "payout",
        vaultId: d.vault_id,
        vaultName: d.vaults?.name ?? "Vault",
        round: d.round_number,
        totalRounds: d.vaults?.total_rounds ?? 0,
        amount: Number(d.amount ?? 0),
        date: d.disbursed_at ?? d.created_at ?? null,
        status: "received",
        txHash: d.tx_hash ?? null,
        currency: "USDC",
      });
    }
    return items.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [activity.contributions, activity.disbursements]);

  const totals = useMemo(() => {
    let contributed = 0;
    let received = 0;
    for (const c of activity.contributions) {
      if (c.status === "confirmed") contributed += Number(c.amount ?? 0);
    }
    for (const d of activity.disbursements) {
      received += Number(d.amount ?? 0);
    }
    return { contributed, received };
  }, [activity.contributions, activity.disbursements]);

  const refetch = useCallback(async () => {
    await refetchVaults();
    await fetchActivity();
  }, [refetchVaults, fetchActivity]);

  // Keep prior public surface for existing callers
  const payments = due;
  const summary = useMemo(
    () => ({ paid: 0, pending: due.length, late: 0, total: due.length }),
    [due],
  );

  return {
    payments,
    due,
    history,
    totals,
    summary,
    loading: profileLoading || vaultsLoading || activity.loading,
    refetch,
    updatePayment: async () => ({ ok: true }),
  };
}
