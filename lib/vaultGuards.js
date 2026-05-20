/**
 * Centralised authorisation/availability guards for vault actions. Every
 * helper returns `{ allowed: boolean, reason?: string }` so it can drive
 * disabled-button states + tooltip copy uniformly across the UI.
 */

const MIN_CUSTODIANS = 3;

function sameAddress(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function findMember(vault, profile, walletAddress) {
  if (!vault?.members?.length) return null;
  return (
    vault.members.find(
      (m) =>
        (profile?.id && m.userId === profile.id) ||
        (walletAddress &&
          m.walletAddress &&
          sameAddress(m.walletAddress, walletAddress)),
    ) ?? null
  );
}

function profileWalletGuard(profile, walletAddress) {
  if (!profile) {
    return { allowed: false, reason: "Sign in to continue" };
  }
  if (!profile.walletAddress) {
    return { allowed: false, reason: "Connect a wallet to your profile" };
  }
  if (!walletAddress) {
    return { allowed: false, reason: "Connect your wallet" };
  }
  if (!sameAddress(profile.walletAddress, walletAddress)) {
    return {
      allowed: false,
      reason: "Connected wallet doesn't match your profile",
    };
  }
  return { allowed: true };
}

/** Whether the user can contribute to the current round of `vault`. */
export function canContribute(vault, profile, walletAddress, opts = {}) {
  const base = profileWalletGuard(profile, walletAddress);
  if (!base.allowed) return base;

  if (!vault) return { allowed: false, reason: "Vault not found" };
  if (vault.status !== "active") {
    return { allowed: false, reason: "Vault is not active" };
  }

  const member = findMember(vault, profile, walletAddress);
  if (!member) return { allowed: false, reason: "Not a vault member" };

  const custodianCount = (vault.members ?? []).filter((m) => m.isCustodian).length;
  if (custodianCount > 0 && custodianCount < MIN_CUSTODIANS) {
    return {
      allowed: false,
      reason: "Custodians have not been assigned yet",
    };
  }

  if (opts.alreadyContributed) {
    return { allowed: false, reason: "You have already contributed this round" };
  }

  if (opts.usdcBalance != null && opts.requiredAmount != null) {
    if (opts.usdcBalance < opts.requiredAmount) {
      return { allowed: false, reason: "Insufficient USDC balance" };
    }
  }

  return { allowed: true };
}

/** Whether the user can sign the supplied pending disbursement. */
export function canSignDisbursement(
  vault,
  disbursement,
  profile,
  walletAddress,
  opts = {},
) {
  const base = profileWalletGuard(profile, walletAddress);
  if (!base.allowed) return base;

  if (!disbursement || disbursement.status !== "pending") {
    return { allowed: false, reason: "Disbursement is not awaiting signatures" };
  }

  const member = findMember(vault, profile, walletAddress);
  if (!member) return { allowed: false, reason: "Not a vault member" };
  if (!member.isCustodian) {
    return { allowed: false, reason: "Only custodians can sign" };
  }

  if (opts.alreadySigned) {
    return { allowed: false, reason: "You have already signed this round" };
  }
  if (opts.roundFullyFunded === false) {
    return { allowed: false, reason: "Round is not fully funded yet" };
  }

  return { allowed: true };
}

/** Organisers can assign custodians only while no money has moved. */
export function canAssignCustodians(vault, profile, opts = {}) {
  if (!profile) return { allowed: false, reason: "Sign in to continue" };
  if (!vault) return { allowed: false, reason: "Vault not found" };
  if (vault.organiserId !== profile.id) {
    return { allowed: false, reason: "Only the organiser can do this" };
  }
  if (vault.status && vault.status !== "pending") {
    return { allowed: false, reason: "Vault is already active" };
  }
  if (opts.hasContributions) {
    return {
      allowed: false,
      reason: "Cannot reassign once contributions have started",
    };
  }
  return { allowed: true };
}

/** A user can create a vault if their profile + wallet are wired up. */
export function canCreateVault(profile, opts = {}) {
  if (!profile) return { allowed: false, reason: "Sign in to continue" };
  if (!profile.fullName || !profile.username) {
    return { allowed: false, reason: "Complete your profile first" };
  }
  if (!profile.walletAddress) {
    return { allowed: false, reason: "Connect a wallet to your profile" };
  }
  if (opts.activeVaultCount != null && opts.activeVaultCount >= 10) {
    return {
      allowed: false,
      reason: "You already have 10 active vaults (limit per organiser)",
    };
  }
  return { allowed: true };
}

export const VAULT_LIMITS = Object.freeze({
  MIN_CUSTODIANS,
  MAX_ACTIVE_VAULTS_PER_ORGANISER: 10,
  MAX_PENDING_INVITES_PER_VAULT: 20,
  USERNAME_CHANGE_COOLDOWN_DAYS: 30,
});
