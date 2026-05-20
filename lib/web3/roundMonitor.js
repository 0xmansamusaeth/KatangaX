import { formatUnits } from "viem";
import { createClient } from "@/lib/supabase/client";
import {
  notifyProfile,
  notifyVaultCustodians,
  notifyVaultMembers,
  resolveVaultIdByContract,
} from "@/lib/supabase/notifications";
import { NOTIFICATION_TYPES } from "@/lib/notificationTemplates";
import { USDC_DECIMALS } from "@/lib/web3/contracts";

function usdcToNumber(amount) {
  try {
    const v = typeof amount === "bigint" ? amount : BigInt(amount ?? 0);
    return Number(formatUnits(v, USDC_DECIMALS));
  } catch {
    return 0;
  }
}

/**
 * Record a contribution on-chain in Supabase and notify the other members.
 * Safe to call from a client component after a confirmed tx.
 */
export async function recordContribution({
  contractAddress,
  vaultId,
  profileId,
  roundNumber,
  amount,
  txHash,
  contributorName,
}) {
  const supabase = createClient();
  const resolvedVaultId =
    vaultId ?? (await resolveVaultIdByContract(contractAddress));
  if (!resolvedVaultId) return { error: "Vault not found in Supabase" };

  const { data: existing } = await supabase
    .from("contributions")
    .select("id")
    .eq("tx_hash", txHash)
    .maybeSingle();

  if (existing) return { data: existing, alreadyRecorded: true };

  const { data, error } = await supabase
    .from("contributions")
    .insert({
      vault_id: resolvedVaultId,
      profile_id: profileId,
      round_number: roundNumber,
      amount,
      tx_hash: txHash,
      status: "confirmed",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  notifyVaultMembers({
    vaultId: resolvedVaultId,
    type: NOTIFICATION_TYPES.CONTRIBUTION_MADE,
    data: { contributorName, round: roundNumber },
    excludeProfileId: profileId,
  }).catch(() => {});

  return { data, vaultId: resolvedVaultId };
}

/**
 * Check whether all members have contributed this round. If so, create/refresh
 * a disbursement record and notify custodians + recipient.
 * @param {{
 *   contractAddress: string,
 *   roundNumber: number,
 *   recipientWalletAddress?: string,
 *   recipientName?: string,
 *   potAmount: bigint,
 *   memberCount: number,
 *   contributionAmount: bigint,
 * }} params
 */
export async function checkAndProgressRound({
  contractAddress,
  roundNumber,
  recipientWalletAddress,
  recipientName,
  potAmount,
  memberCount,
  contributionAmount,
}) {
  const supabase = createClient();
  const vaultId = await resolveVaultIdByContract(contractAddress);
  if (!vaultId) return { error: "Vault not found in Supabase" };

  const { count } = await supabase
    .from("contributions")
    .select("id", { count: "exact", head: true })
    .eq("vault_id", vaultId)
    .eq("round_number", roundNumber)
    .eq("status", "confirmed");

  const fullyFunded = (count ?? 0) >= memberCount;
  if (!fullyFunded) return { fullyFunded: false };

  let recipientProfileId = null;
  if (recipientWalletAddress) {
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("wallet_address", recipientWalletAddress)
      .maybeSingle();
    recipientProfileId = recipientProfile?.id ?? null;
  }

  const { data: existing } = await supabase
    .from("disbursements")
    .select("id, status")
    .eq("vault_id", vaultId)
    .eq("round_number", roundNumber)
    .maybeSingle();

  let disbursementId = existing?.id;
  if (!disbursementId) {
    const potNumeric =
      usdcToNumber(potAmount) ||
      usdcToNumber((contributionAmount ?? 0n) * BigInt(memberCount ?? 0));
    const { data: inserted, error: insertErr } = await supabase
      .from("disbursements")
      .insert({
        vault_id: vaultId,
        round_number: roundNumber,
        recipient_id: recipientProfileId,
        amount: potNumeric,
        status: "pending",
      })
      .select()
      .single();
    if (insertErr) return { error: insertErr.message };
    disbursementId = inserted.id;
  }

  notifyVaultCustodians({
    vaultId,
    type: NOTIFICATION_TYPES.SIGNATURE_NEEDED,
    data: { round: roundNumber, recipientName },
  }).catch(() => {});

  if (recipientProfileId) {
    notifyProfile({
      profileId: recipientProfileId,
      vaultId,
      type: NOTIFICATION_TYPES.SIGNATURE_NEEDED,
      data: { round: roundNumber, recipientName: "you" },
    }).catch(() => {});
  }

  return { fullyFunded: true, disbursementId, vaultId };
}

/** Record a custodian signature. */
export async function recordSignature({
  disbursementId,
  custodianProfileId,
  walletAddress,
  signature,
  vaultId,
  signerName,
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disbursement_signatures")
    .insert({
      disbursement_id: disbursementId,
      custodian_id: custodianProfileId,
      wallet_address: walletAddress,
      signature,
    })
    .select()
    .single();

  if (error && !error.message.includes("duplicate")) return { error: error.message };

  const { count: sigCount } = await supabase
    .from("disbursement_signatures")
    .select("id", { count: "exact", head: true })
    .eq("disbursement_id", disbursementId);

  if (vaultId && sigCount) {
    notifyVaultMembers({
      vaultId,
      type: NOTIFICATION_TYPES.SIGNATURE_ADDED,
      data: { signerName, collected: sigCount },
      excludeProfileId: custodianProfileId,
    }).catch(() => {});
  }

  return { data, signatureCount: sigCount ?? 0 };
}

/** Mark disbursement as disbursed + advance round + notify members. */
export async function markDisbursed({
  disbursementId,
  vaultId,
  txHash,
  recipientName,
  amountLabel,
  newRound,
  totalRounds,
  nextRecipientName,
}) {
  const supabase = createClient();

  await supabase
    .from("disbursements")
    .update({
      status: "disbursed",
      tx_hash: txHash,
      disbursed_at: new Date().toISOString(),
    })
    .eq("id", disbursementId);

  if (newRound && totalRounds) {
    const status = newRound > totalRounds ? "completed" : "active";
    await supabase
      .from("vaults")
      .update({ current_round: Math.min(newRound, totalRounds), status })
      .eq("id", vaultId);
  }

  notifyVaultMembers({
    vaultId,
    type: NOTIFICATION_TYPES.PAYOUT_DISBURSED,
    data: { recipientName, amount: amountLabel },
  }).catch(() => {});

  if (newRound && totalRounds && newRound > totalRounds) {
    notifyVaultMembers({
      vaultId,
      type: NOTIFICATION_TYPES.VAULT_COMPLETED,
      data: {},
    }).catch(() => {});
  } else if (newRound && nextRecipientName) {
    notifyVaultMembers({
      vaultId,
      type: NOTIFICATION_TYPES.ROUND_ADVANCED,
      data: { round: newRound, nextRecipientName },
    }).catch(() => {});
  }
}
