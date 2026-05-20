"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to Supabase realtime changes for one vault. The supplied
 * handlers are invoked with the payload row(s) from Postgres changes.
 * Unsubscribes automatically on unmount.
 *
 * @param {string|null|undefined} vaultId
 * @param {{
 *   onContribution?: (row: any) => void,
 *   onSignature?: (row: any) => void,
 *   onDisbursement?: (row: any) => void,
 *   onMember?: (row: any) => void,
 * }} handlers
 */
export function useVaultRealtime(vaultId, handlers = {}) {
  useEffect(() => {
    if (!vaultId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`vault:${vaultId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contributions",
          filter: `vault_id=eq.${vaultId}`,
        },
        (payload) => handlers.onContribution?.(payload.new),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "disbursement_signatures",
        },
        (payload) => handlers.onSignature?.(payload.new),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "disbursements",
          filter: `vault_id=eq.${vaultId}`,
        },
        (payload) => handlers.onDisbursement?.(payload.new ?? payload.old),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vault_members",
          filter: `vault_id=eq.${vaultId}`,
        },
        (payload) => handlers.onMember?.(payload.new ?? payload.old),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vaultId, handlers]);
}
