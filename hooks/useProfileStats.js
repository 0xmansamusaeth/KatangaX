"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";

/**
 * Aggregate profile-level stats sourced from Supabase:
 *  - vaultsJoined, vaultsCompleted, custodianOf
 *  - totalContributed, totalReceived (in vault currency, USDC by default)
 */
export function useProfileStats() {
  const { profile, loading: profileLoading } = useProfile();
  const [stats, setStats] = useState({
    vaultsJoined: 0,
    vaultsCompleted: 0,
    custodianOf: 0,
    totalContributed: 0,
    totalReceived: 0,
    onTime: 0,
    missed: 0,
    reliability: 100,
    loading: true,
  });

  const refetch = useCallback(async () => {
    if (!profile?.id) {
      setStats((s) => ({ ...s, loading: false }));
      return;
    }
    const supabase = createClient();

    const [memberRows, contribRows, disbRows] = await Promise.all([
      supabase
        .from("vault_members")
        .select("id, is_custodian, vault_id, vaults!inner(status)")
        .eq("profile_id", profile.id),
      supabase
        .from("contributions")
        .select("amount, status")
        .eq("profile_id", profile.id),
      supabase
        .from("disbursements")
        .select("amount, status")
        .eq("recipient_id", profile.id)
        .eq("status", "disbursed"),
    ]);

    const memberships = memberRows.data ?? [];
    const vaultsJoined = memberships.length;
    const vaultsCompleted = memberships.filter(
      (m) => m.vaults?.status === "completed",
    ).length;
    const custodianOf = memberships.filter((m) => m.is_custodian).length;

    const contribs = contribRows.data ?? [];
    let totalContributed = 0;
    let onTime = 0;
    let missed = 0;
    for (const c of contribs) {
      const amt = Number(c.amount ?? 0);
      totalContributed += amt;
      if (c.status === "confirmed") onTime += 1;
      else if (c.status === "late") missed += 1;
    }

    let totalReceived = 0;
    for (const d of disbRows.data ?? []) {
      totalReceived += Number(d.amount ?? 0);
    }

    const reliability =
      onTime + missed === 0
        ? 100
        : Math.round((onTime / (onTime + missed)) * 100);

    setStats({
      vaultsJoined,
      vaultsCompleted,
      custodianOf,
      totalContributed,
      totalReceived,
      onTime,
      missed,
      reliability,
      loading: false,
    });
  }, [profile?.id]);

  useEffect(() => {
    if (!profileLoading) refetch();
  }, [profileLoading, refetch]);

  return { ...stats, refetch };
}
