"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Loads supabase-side state for a single vault: contributions for the
 * current round, latest disbursement + its signatures.
 *
 * @param {string|null|undefined} vaultId
 * @param {number} roundNumber
 */
export function useVaultRoundData(vaultId, roundNumber) {
  const [data, setData] = useState({
    contributions: [],
    disbursement: null,
    signatures: [],
    loading: true,
  });

  const refetch = useCallback(async () => {
    if (!vaultId || !roundNumber) {
      setData({ contributions: [], disbursement: null, signatures: [], loading: false });
      return;
    }
    const supabase = createClient();

    const [{ data: contribs }, { data: disb }] = await Promise.all([
      supabase
        .from("contributions")
        .select("id, profile_id, amount, tx_hash, status, contributed_at")
        .eq("vault_id", vaultId)
        .eq("round_number", roundNumber),
      supabase
        .from("disbursements")
        .select("*")
        .eq("vault_id", vaultId)
        .eq("round_number", roundNumber)
        .maybeSingle(),
    ]);

    let signatures = [];
    if (disb?.id) {
      const { data: sigs } = await supabase
        .from("disbursement_signatures")
        .select("*")
        .eq("disbursement_id", disb.id);
      signatures = sigs ?? [];
    }

    setData({
      contributions: contribs ?? [],
      disbursement: disb ?? null,
      signatures,
      loading: false,
    });
  }, [vaultId, roundNumber]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...data, refetch };
}
