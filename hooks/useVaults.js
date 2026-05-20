"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapVaultRow, mapVaultMember } from "@/lib/supabase/mappers";

export function useVaults() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setVaults([]);
      setLoading(false);
      return;
    }

    const { data, error: rpcErr } = await supabase.rpc("get_user_vaults", {
      user_uuid: user.id,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setVaults([]);
      setLoading(false);
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    const mapped = rows.map((row) => {
      const v = row.vault ?? row;
      const members = row.members ?? [];
      const vault = mapVaultRow(v, members);
      vault.isOrganiser = Boolean(row.is_organiser);
      vault.myPayoutOrder = row.my_payout_order;
      return vault;
    });

    setVaults(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addVault = useCallback(
    async (vaultPayload) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not signed in" };

      const { data: vault, error: insertErr } = await supabase
        .from("vaults")
        .insert({
          contract_address: vaultPayload.contractAddress,
          name: vaultPayload.name,
          organiser_id: user.id,
          contribution_amount: vaultPayload.contributionAmount,
          frequency: vaultPayload.frequency ?? "monthly",
          total_members: vaultPayload.memberCount,
          total_rounds: vaultPayload.totalRounds ?? vaultPayload.memberCount,
          current_round: 1,
          status: vaultPayload.status ?? "active",
          payout_order: vaultPayload.payoutOrderMethod ?? "fixed",
          rules: vaultPayload.description ?? "",
          payment_method: vaultPayload.paymentMethod ?? "usdc",
        })
        .select()
        .single();

      if (insertErr) return { error: insertErr.message };

      const members = vaultPayload.members ?? [];
      if (members.length) {
        const memberRows = members.map((m, idx) => ({
          vault_id: vault.id,
          profile_id:
            m.userId && String(m.userId).length === 36 ? m.userId : null,
          wallet_address: m.walletAddress ?? m.wallet_address ?? "",
          payout_order: m.payoutOrder ?? idx + 1,
          is_custodian: Boolean(m.isCustodian),
        }));
        const { error: membersErr } = await supabase
          .from("vault_members")
          .insert(memberRows);
        if (membersErr) return { error: membersErr.message };
      }

      await refetch();
      return { data: vault };
    },
    [refetch],
  );

  const updateVault = useCallback(
    async (vaultId, patch) => {
      const supabase = createClient();
      const dbPatch = {};
      if (typeof patch === "function") {
        const current = vaults.find((v) => v.id === vaultId);
        if (!current) return { error: "Vault not found" };
        patch = patch(current);
      }
      if (patch.name != null) dbPatch.name = patch.name;
      if (patch.status != null) dbPatch.status = patch.status;
      if (patch.currentRound != null) dbPatch.current_round = patch.currentRound;
      if (patch.description != null) dbPatch.rules = patch.description;

      const { error: updateErr } = await supabase
        .from("vaults")
        .update(dbPatch)
        .eq("id", vaultId);

      if (updateErr) return { error: updateErr.message };
      await refetch();
      return { ok: true };
    },
    [refetch, vaults],
  );

  const markContribution = useCallback(
    async (vaultId, memberId, round, txHash, amount) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (txHash && amount) {
        await supabase.from("contributions").insert({
          vault_id: vaultId,
          profile_id: user.id,
          round_number: round,
          amount,
          tx_hash: txHash,
          status: "confirmed",
        });
      }
      await refetch();
    },
    [refetch],
  );

  const disbursePayout = useCallback(
    async (vaultId) => {
      const v = vaults.find((x) => x.id === vaultId);
      if (!v) return;
      const nextRound = Math.min(v.totalRounds, v.currentRound + 1);
      await updateVault(vaultId, {
        currentRound: nextRound,
        status: nextRound > v.totalRounds ? "completed" : v.status,
      });
    },
    [vaults, updateVault],
  );

  const removeMember = useCallback(async () => {
    /* organiser flow — implement via vault_members delete */
  }, []);

  const endVault = useCallback(
    async (vaultId) => updateVault(vaultId, { status: "completed" }),
    [updateVault],
  );

  return {
    vaults,
    loading,
    error,
    refetch,
    updateVault,
    addVault,
    markContribution,
    disbursePayout,
    removeMember,
    endVault,
  };
}
