import {
  Bell,
  CheckCircle2,
  Gift,
  Landmark,
  PartyPopper,
  ShieldCheck,
  Signature,
  UserPlus,
} from "lucide-react";

/** @typedef {"vault_invite"|"contribution_made"|"signature_needed"|"signature_added"|"payout_disbursed"|"round_advanced"|"vault_completed"} NotificationType */

export const NOTIFICATION_TYPES = {
  VAULT_INVITE: "vault_invite",
  CONTRIBUTION_MADE: "contribution_made",
  SIGNATURE_NEEDED: "signature_needed",
  SIGNATURE_ADDED: "signature_added",
  PAYOUT_DISBURSED: "payout_disbursed",
  ROUND_ADVANCED: "round_advanced",
  VAULT_COMPLETED: "vault_completed",
};

export const NOTIFICATION_META = {
  vault_invite: {
    Icon: Landmark,
    wrap: "bg-[#1E40AF]/15 text-[#1E40AF]",
    actionable: true,
  },
  contribution_made: {
    Icon: CheckCircle2,
    wrap: "bg-[#16A34A]/15 text-[#166534]",
  },
  signature_needed: {
    Icon: ShieldCheck,
    wrap: "bg-[#FFC107]/25 text-[#92400E]",
  },
  signature_added: {
    Icon: Signature,
    wrap: "bg-[#FFC107]/15 text-[#92400E]",
  },
  payout_disbursed: {
    Icon: Gift,
    wrap: "bg-[#FFC107]/25 text-[#92400E]",
  },
  round_advanced: {
    Icon: PartyPopper,
    wrap: "bg-[#16A34A]/10 text-[#166534]",
  },
  vault_completed: {
    Icon: PartyPopper,
    wrap: "bg-[#1B5E20]/15 text-[#1B5E20]",
  },
};

/**
 * @param {string} type
 * @param {Record<string, any>} data
 * @returns {{ title: string, message: string }}
 */
export function renderNotification(type, data = {}) {
  switch (type) {
    case NOTIFICATION_TYPES.VAULT_INVITE:
      return {
        title: "Vault invitation",
        message: `${data.inviterName ?? "An organiser"} invited you to join "${data.vaultName ?? "a vault"}".`,
      };
    case NOTIFICATION_TYPES.CONTRIBUTION_MADE:
      return {
        title: "New contribution",
        message: `${data.contributorName ?? "A member"} contributed to Round ${data.round ?? "?"}.`,
      };
    case NOTIFICATION_TYPES.SIGNATURE_NEEDED:
      return {
        title: "🔐 Action required",
        message: `Round ${data.round ?? "?"} is fully funded. Sign to release the payout to ${data.recipientName ?? "the recipient"}.`,
      };
    case NOTIFICATION_TYPES.SIGNATURE_ADDED:
      return {
        title: "Signature collected",
        message: `${data.signerName ?? "A custodian"} signed. ${data.collected ?? 0} of 3 signatures collected.`,
      };
    case NOTIFICATION_TYPES.PAYOUT_DISBURSED:
      return {
        title: "💰 Payout sent",
        message: `${data.recipientName ?? "Recipient"} received ${data.amount ?? "their"} USDC payout.`,
      };
    case NOTIFICATION_TYPES.ROUND_ADVANCED:
      return {
        title: "New round started",
        message: `Round ${data.round ?? "?"} is now open. Next recipient: ${data.nextRecipientName ?? "TBD"}.`,
      };
    case NOTIFICATION_TYPES.VAULT_COMPLETED:
      return {
        title: "🎉 Vault completed",
        message: `All rounds in "${data.vaultName ?? "the vault"}" have been paid out.`,
      };
    default:
      return {
        title: data.title ?? "Notification",
        message: data.message ?? "",
      };
  }
}

export function getNotificationMeta(type) {
  return NOTIFICATION_META[type] ?? { Icon: Bell, wrap: "bg-[#F3F4F6] text-[#4B5563]" };
}
