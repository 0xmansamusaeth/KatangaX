"use client";

import { useMemo } from "react";
import { useVaults } from "@/hooks/useVaults";
import { useProfile } from "@/hooks/useProfile";

/**
 * Payment dues derived from vault membership (replaces mock payments store).
 */
export function usePayments() {
  const { vaults, loading: vaultsLoading, refetch } = useVaults();
  const { profile, loading: profileLoading } = useProfile();

  const payments = useMemo(() => {
    if (!profile?.id) return [];
    const list = [];
    for (const v of vaults) {
      if (v.status !== "active") continue;
      const myMember = v.members?.find(
        (m) => m.userId === profile.id || m.walletAddress === profile.walletAddress,
      );
      if (!myMember) continue;
      list.push({
        id: `${v.id}-r${v.currentRound}`,
        vaultId: v.id,
        vaultName: v.name,
        memberId: myMember.id,
        round: v.currentRound,
        amount: v.contributionAmount,
        status: "pending",
        dueDate: v.startDate || new Date().toISOString().slice(0, 10),
        currency: v.paymentMethod === "usdc" ? "USDC" : "ZMW",
      });
    }
    return list;
  }, [vaults, profile?.id, profile?.walletAddress]);

  const summary = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid").length;
    const pending = payments.filter((p) => p.status === "pending").length;
    const late = payments.filter((p) => p.status === "late").length;
    return { paid, pending, late, total: payments.length };
  }, [payments]);

  return {
    payments,
    loading: vaultsLoading || profileLoading,
    summary,
    refetch,
    updatePayment: async () => ({ ok: true }),
  };
}
