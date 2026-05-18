export const MEMBERS_POOL = [
  {
    id: "m1",
    name: "Thandiwe Phiri",
    initials: "TP",
    avatarColor: "#1B5E20",
    phone: "+260 97 234 1101",
  },
  {
    id: "m2",
    name: "Mwamba Mutale",
    initials: "MM",
    avatarColor: "#2E7D32",
    phone: "+260 96 511 2208",
  },
  {
    id: "m3",
    name: "Chanda Mwale",
    initials: "CM",
    avatarColor: "#145214",
    phone: "+260 95 884 3392",
  },
  {
    id: "m4",
    name: "Bwalya Kasonde",
    initials: "BK",
    avatarColor: "#FFC107",
    phone: "+260 97 102 7714",
  },
  {
    id: "m5",
    name: "Mutinta Hachipuka",
    initials: "MH",
    avatarColor: "#D97706",
    phone: "+260 96 660 8821",
  },
  {
    id: "m6",
    name: "Lubasi Mwanza",
    initials: "LM",
    avatarColor: "#16A34A",
    phone: "+260 95 412 5503",
  },
  {
    id: "m7",
    name: "Namwila Banda",
    initials: "NB",
    avatarColor: "#145214",
    phone: "+260 97 707 6610",
  },
  {
    id: "m8",
    name: "Kafula Chileshe",
    initials: "KC",
    avatarColor: "#6B7280",
    phone: "+260 96 119 4422",
  },
  {
    id: "m9",
    name: "Mulenga Kapasa",
    initials: "MK",
    avatarColor: "#DC2626",
    phone: "+260 95 808 0091",
  },
  {
    id: "m10",
    name: "Sosala Tembo",
    initials: "ST",
    avatarColor: "#2E7D32",
    phone: "+260 97 332 5588",
  },
];

/** Extra members for the 20-member vault only */
const LUSAKA_EXTRA_MEMBERS = [
  { id: "m11", name: "Mwenda Lisulo", initials: "ML", avatarColor: "#155E34", phone: "+260 95 110 0001" },
  { id: "m12", name: "Chenje Sichone", initials: "CS", avatarColor: "#374151", phone: "+260 96 110 0002" },
  { id: "m13", name: "Nkomba Chabala", initials: "NC", avatarColor: "#92400E", phone: "+260 97 110 0003" },
  { id: "m14", name: "Tisa Malupenga", initials: "TM", avatarColor: "#1E40AF", phone: "+260 95 110 0004" },
  { id: "m15", name: "Lupiya Zulu", initials: "LZ", avatarColor: "#7C2D12", phone: "+260 96 110 0005" },
  { id: "m16", name: "Chileshe Chitundu", initials: "CC", avatarColor: "#0F766E", phone: "+260 97 110 0006" },
  { id: "m17", name: "Muchinda Hamoonga", initials: "MU", avatarColor: "#6D28D9", phone: "+260 95 110 0007" },
  { id: "m18", name: "Banda Mweetwa", initials: "BM", avatarColor: "#B45309", phone: "+260 96 110 0008" },
  { id: "m19", name: "Chisanga Mwila", initials: "CI", avatarColor: "#047857", phone: "+260 97 110 0009" },
  { id: "m20", name: "Tembo Lungu", initials: "TL", avatarColor: "#4338CA", phone: "+260 95 110 0010" },
];

export const MOCK_USER = {
  id: "u1",
  name: "Amara Banda",
  phone: "+260 97 123 4567",
  memberSince: "2024-01-15",
  currency: "ZMW",
  avatarColor: "#1B5E20",
  paymentMethods: [
    {
      id: "pm1",
      provider: "MTN Mobile Money",
      providerShort: "MTN",
      last4: "4567",
      isDefault: true,
      color: "#FFC107",
    },
    {
      id: "pm2",
      provider: "Airtel Money",
      providerShort: "Airtel",
      last4: "8901",
      isDefault: false,
      color: "#DC2626",
    },
  ],
};

function pickMembers(...ids) {
  const map = Object.fromEntries(MEMBERS_POOL.map((m) => [m.id, m]));
  return ids.map((id) => map[id]).filter(Boolean);
}

function buildContributionHistory(baseAmount, memberIds, mix = "mostlyPaid") {
  const statuses =
    mix === "mostlyPaid"
      ? ["paid", "paid", "paid", "paid", "paid", "paid", "pending", "late"]
      : mix === "mixed"
        ? ["paid", "paid", "paid", "pending", "paid", "late", "paid", "pending"]
        : ["paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid"];

  return [2, 1, 0].map((offset, idx) => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - offset);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const memberPayments = {};
    memberIds.forEach((mid, i) => {
      memberPayments[mid] = statuses[(i + idx) % statuses.length];
    });
    const paidCount = Object.values(memberPayments).filter(
      (s) => s === "paid",
    ).length;
    return {
      period: key,
      totalCollected: Math.round(baseAmount * paidCount * 0.95),
      expectedTotal: baseAmount * memberIds.length,
      memberPayments,
    };
  });
}

function roundPaymentPattern(roundIdx, memberIds) {
  const out = {};
  memberIds.forEach((mid, i) => {
    const r = (roundIdx + i) % 7;
    if (r <= 4) out[mid] = "paid";
    else if (r === 5) out[mid] = "pending";
    else out[mid] = "late";
  });
  return out;
}

function withDefaults(member, overrides = {}) {
  return {
    ...member,
    agreementAccepted: true,
    ...overrides,
  };
}

const chamaMembers = pickMembers(
  "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
).map((m, index) =>
  withDefaults(m, {
    payoutOrder: index + 1,
    userId: m.id === "m1" ? MOCK_USER.id : undefined,
    agreementAccepted: m.id !== "m9",
  }),
);

const fridayMembers = pickMembers("m2", "m5", "m7", "m9", "m10").map(
  (m, index) =>
    withDefaults(m, {
      payoutOrder: index + 1,
      userId: m.id === "m2" ? MOCK_USER.id : undefined,
    }),
);

const lusakaMembers = [...MEMBERS_POOL, ...LUSAKA_EXTRA_MEMBERS].map(
  (m, index) =>
    withDefaults(m, {
      payoutOrder: index + 1,
      userId: m.id === "m6" ? MOCK_USER.id : undefined,
    }),
);

export const MOCK_VAULTS = [
  {
    id: "vault-chama",
    name: "Chama wa Mama",
    description:
      "Monthly contributions to support mothers in our neighbourhood. Late contributions incur a 50 ZMW fee after a 48-hour grace period.",
    memberCount: 10,
    contributionAmount: 500,
    contributionPeriod: "month",
    currentRound: 4,
    totalRounds: 10,
    status: "active",
    startDate: "2026-02-15",
    payoutOrderMethod: "fixed",
    createdBy: MOCK_USER.name,
    organiserId: chamaMembers[0].id,
    payoutRecipientMemberId: chamaMembers[3].id,
    members: chamaMembers,
    contributionHistory: buildContributionHistory(
      500,
      chamaMembers.map((m) => m.id),
      "mostlyPaid",
    ),
    paymentStatusesByRound: {
      1: roundPaymentPattern(0, chamaMembers.map((m) => m.id)),
      2: roundPaymentPattern(1, chamaMembers.map((m) => m.id)),
      3: roundPaymentPattern(2, chamaMembers.map((m) => m.id)),
      4: {
        ...roundPaymentPattern(3, chamaMembers.map((m) => m.id)),
        [chamaMembers[0].id]: "pending",
      },
    },
  },
  {
    id: "vault-friday",
    name: "Friday Five",
    description:
      "Weekly Friday savings ring. Quick rotations, small amounts — designed to build the habit.",
    memberCount: 5,
    contributionAmount: 200,
    contributionPeriod: "week",
    currentRound: 1,
    totalRounds: 5,
    status: "active",
    startDate: "2026-05-08",
    payoutOrderMethod: "random",
    createdBy: "Mutinta Hachipuka",
    organiserId: fridayMembers[1].id,
    payoutRecipientMemberId: fridayMembers[0].id,
    members: fridayMembers,
    contributionHistory: buildContributionHistory(
      200,
      fridayMembers.map((m) => m.id),
      "mixed",
    ),
    paymentStatusesByRound: {
      1: roundPaymentPattern(2, fridayMembers.map((m) => m.id)),
    },
  },
  {
    id: "vault-lusaka",
    name: "Lusaka 20",
    description:
      "Twenty members, twenty months. Fixed order set at the start; payouts disbursed on the 1st of each month.",
    memberCount: 20,
    contributionAmount: 1000,
    contributionPeriod: "month",
    currentRound: 20,
    totalRounds: 20,
    status: "completed",
    startDate: "2024-09-01",
    payoutOrderMethod: "fixed",
    createdBy: "Bwalya Kasonde",
    organiserId: lusakaMembers[3].id,
    payoutRecipientMemberId: lusakaMembers[19].id,
    members: lusakaMembers,
    contributionHistory: buildContributionHistory(
      1000,
      lusakaMembers.map((m) => m.id),
      "complete",
    ),
    paymentStatusesByRound: Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [
        String(i + 1),
        roundPaymentPattern(i % 5, lusakaMembers.map((m) => m.id)),
      ]),
    ),
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "payment_reminder",
    title: "Contribution due tomorrow",
    body: "Chama wa Mama — ZMW 500 is due on the 19th for Round 4.",
    createdAt: "2026-05-18T09:30:00.000Z",
    read: false,
    vaultId: "vault-chama",
  },
  {
    id: "n2",
    type: "payout_alert",
    title: "Payout incoming",
    body: "Friday Five — you are position 2 this cycle; funds will be released after confirmations.",
    createdAt: "2026-05-18T07:12:00.000Z",
    read: false,
    vaultId: "vault-friday",
  },
  {
    id: "n3",
    type: "member_join",
    title: "New member joined",
    body: "Kafula Chileshe joined Lusaka 20 as a late replacement for Round 18–20.",
    createdAt: "2026-05-16T11:05:00.000Z",
    read: true,
    vaultId: "vault-lusaka",
  },
  {
    id: "n4",
    type: "late_payment",
    title: "Late payment warning",
    body: "One member in Chama wa Mama is 3 days late. Tap to view details.",
    createdAt: "2026-05-15T08:45:00.000Z",
    read: false,
    vaultId: "vault-chama",
  },
  {
    id: "n5",
    type: "invitation",
    title: "Vault invitation",
    body: "You’ve been invited to “Copperbelt Builders” — review rules before accepting.",
    createdAt: "2026-05-13T16:22:00.000Z",
    read: false,
    invitePayload: {
      name: "Copperbelt Builders",
      contributionAmount: 750,
      contributionPeriod: "month",
      memberCount: 8,
      totalRounds: 8,
      payoutOrderMethod: "fixed",
      startDate: "2026-06-01",
      description:
        "Eight builders across Copperbelt pooling ZMW 750/month for tool kits.",
    },
  },
  {
    id: "n6",
    type: "payment_reminder",
    title: "Weekly pledge",
    body: "Friday Five — ZMW 200 weekly contribution is due Friday 17:00.",
    createdAt: "2026-05-12T07:55:00.000Z",
    read: true,
    vaultId: "vault-friday",
  },
  {
    id: "n7",
    type: "payout_alert",
    title: "Vault completed",
    body: "Lusaka 20 finished all rounds. Final statements are available in the vault.",
    createdAt: "2026-05-02T13:40:00.000Z",
    read: true,
    vaultId: "vault-lusaka",
  },
  {
    id: "n8",
    type: "late_payment",
    title: "Grace period ending",
    body: "Chama wa Mama — late fees apply after 48 hours without payment.",
    createdAt: "2026-04-28T20:10:00.000Z",
    read: true,
    vaultId: "vault-chama",
  },
];

function buildPayments() {
  /** @type {any[]} */
  const rows = [];
  const dueDates = ["2026-05-10", "2026-05-19", "2026-05-22", "2026-05-25"];
  let dIdx = 0;

  MOCK_VAULTS.forEach((v) => {
    v.members.slice(0, 4).forEach((member) => {
      let dueDate = dueDates[dIdx % dueDates.length];
      dIdx += 1;

      let status =
        v.id === "vault-friday"
          ? "pending"
          : v.id === "vault-chama"
            ? member.userId === MOCK_USER.id
              ? "pending"
              : "paid"
            : "paid";

      // Tailored dates for Amara so the Due tab shows one overdue + one upcoming.
      if (member.userId === MOCK_USER.id) {
        if (v.id === "vault-chama") {
          dueDate = "2026-05-10";
          status = "late";
        } else if (v.id === "vault-friday") {
          dueDate = "2026-05-22";
          status = "pending";
        }
      }

      rows.push({
        id: `pay-${v.id}-${member.id}-${v.currentRound}`,
        vaultId: v.id,
        vaultName: v.name,
        memberId: member.id,
        memberName: member.name,
        amount: v.contributionAmount,
        currency: MOCK_USER.currency,
        status,
        dueDate,
        paidAt:
          v.id === "vault-chama" && status === "paid" ? "2026-05-15" : null,
        round: v.currentRound,
        period: v.contributionPeriod,
      });
    });
  });
  return rows;
}

export const MOCK_PAYMENTS = buildPayments();

export function getSeedState() {
  return {
    schemaVersion: 1,
    user: MOCK_USER,
    vaults: MOCK_VAULTS,
    notifications: MOCK_NOTIFICATIONS,
    payments: MOCK_PAYMENTS,
  };
}
