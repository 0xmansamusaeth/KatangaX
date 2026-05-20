import { createClient } from "@/lib/supabase/client";
import { renderNotification } from "@/lib/notificationTemplates";

/** Notify every member of a vault (optionally excluding one). */
export async function notifyVaultMembers({
  vaultId,
  type,
  data,
  excludeProfileId,
}) {
  const supabase = createClient();
  const { title, message } = renderNotification(type, data);
  return supabase.rpc("notify_vault_members", {
    p_vault_id: vaultId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_exclude_profile_id: excludeProfileId ?? null,
  });
}

export async function notifyVaultCustodians({ vaultId, type, data }) {
  const supabase = createClient();
  const { title, message } = renderNotification(type, data);
  return supabase.rpc("notify_vault_custodians", {
    p_vault_id: vaultId,
    p_type: type,
    p_title: title,
    p_message: message,
  });
}

export async function notifyProfile({ profileId, vaultId, type, data }) {
  const supabase = createClient();
  const { title, message } = renderNotification(type, data);
  return supabase.rpc("notify_profile", {
    p_profile_id: profileId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_vault_id: vaultId ?? null,
  });
}

/** Lookup Supabase vault UUID from on-chain contract address. */
export async function resolveVaultIdByContract(contractAddress) {
  if (!contractAddress) return null;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_vault_by_contract", {
    p_contract_address: contractAddress,
  });
  if (error) return null;
  return data ?? null;
}
