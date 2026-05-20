"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapVaultRow, mapVaultMember } from "@/lib/supabase/mappers";

/**
 * @param {string|undefined} vaultId UUID or contract address
 */
export function useVault(vaultId) {
  const [vault, setVault] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!vaultId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    setLoading(true);
    setError(null);

    let resolvedId = vaultId;
    if (vaultId.startsWith("0x")) {
      const { data: byContract } = await supabase
        .from("vaults")
        .select("id")
        .eq("contract_address", vaultId)
        .maybeSingle();
      if (!byContract) {
        setVault(null);
        setMembers([]);
        setLoading(false);
        return;
      }
      resolvedId = byContract.id;
    }

    const { data, error: rpcErr } = await supabase.rpc("get_vault_with_members", {
      vault_uuid: resolvedId,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setVault(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const payload = data ?? {};
    const v = payload.vault;
    const memberEntries = Array.isArray(payload.members) ? payload.members : [];
    const mappedMembers = memberEntries.map(mapVaultMember);

    setVault(v ? mapVaultRow(v, mappedMembers) : null);
    setMembers(mappedMembers);
    setLoading(false);
  }, [vaultId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { vault, members, loading, error, refetch };
}
