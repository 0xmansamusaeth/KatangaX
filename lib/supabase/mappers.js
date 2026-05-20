import { getInitials } from "@/lib/utils";

/** @param {Record<string, unknown>|null} row */
export function mapProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    username: row.username,
    avatarColor: row.avatar_color ?? "#1B5E20",
    walletAddress: row.wallet_address ?? null,
    isCustodianEligible: Boolean(row.is_custodian_eligible),
    createdAt: row.created_at,
  };
}

/** Legacy app shape for gradual UI migration */
export function profileToUser(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.fullName,
    phone: profile.phoneNumber,
    username: profile.username,
    avatarColor: profile.avatarColor,
    walletAddress: profile.walletAddress,
    memberSince: profile.createdAt?.slice?.(0, 10) ?? "",
    currency: "USDC",
    paymentMethods: [],
  };
}

const FREQ_MAP = {
  weekly: "week",
  biweekly: "biweek",
  monthly: "month",
};

const FREQ_REVERSE = {
  week: "weekly",
  biweek: "biweekly",
  month: "monthly",
};

/** @param {Record<string, unknown>} vaultRow */
export function mapVaultRow(vaultRow, members = []) {
  const freq = vaultRow.frequency;
  return {
    id: vaultRow.id,
    name: vaultRow.name,
    contractAddress: vaultRow.contract_address,
    contributionAmount: Number(vaultRow.contribution_amount),
    contributionPeriod: FREQ_MAP[freq] ?? freq ?? "month",
    frequency: freq,
    memberCount: Number(vaultRow.total_members),
    totalMembers: Number(vaultRow.total_members),
    currentRound: Number(vaultRow.current_round ?? 1),
    totalRounds: Number(vaultRow.total_rounds),
    status: vaultRow.status,
    payoutOrderMethod: vaultRow.payout_order,
    paymentMethod: vaultRow.payment_method ?? "usdc",
    description: vaultRow.rules ?? "",
    startDate: vaultRow.round_deadline?.slice?.(0, 10) ?? "",
    organiserId: vaultRow.organiser_id,
    members: members.map(mapVaultMember),
    paymentStatusesByRound: {},
    contributionHistory: [],
  };
}

/** @param {{ member?: object, profile?: object }|object} entry */
export function mapVaultMember(entry) {
  const vm = entry.member ?? entry;
  const p = entry.profile ?? {};
  const name = p.full_name ?? truncateAddr(vm.wallet_address);
  return {
    id: vm.id ?? vm.profile_id,
    userId: vm.profile_id,
    name,
    initials: getInitials(name),
    avatarColor: p.avatar_color ?? "#6B7280",
    phone: p.phone_number ?? "",
    payoutOrder: vm.payout_order,
    walletAddress: vm.wallet_address,
    isCustodian: Boolean(vm.is_custodian),
    agreementAccepted: true,
  };
}

function truncateAddr(addr) {
  if (!addr || typeof addr !== "string") return "Member";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function wizardFrequencyToDb(period) {
  return FREQ_REVERSE[period] ?? "monthly";
}

export function mapNotificationRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    body: row.message,
    vaultId: row.vault_id,
    read: row.is_read,
    createdAt: row.created_at,
    time: row.created_at,
    metadata: row.metadata ?? {},
  };
}

export function mapSearchProfile(row) {
  return {
    id: row.id,
    name: row.full_name,
    username: row.username,
    initials: getInitials(row.full_name),
    avatarColor: row.avatar_color ?? "#1B5E20",
    walletAddress: row.wallet_address,
  };
}
