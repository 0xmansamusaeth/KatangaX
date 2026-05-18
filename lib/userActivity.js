import {
  dateToIsoLocal,
  formatDate,
  getRoundDateRange,
  isDueDateOverdue,
} from "@/lib/utils";

function getUserMember(vault, userId) {
  return vault?.members?.find((m) => m.userId === userId) ?? null;
}

function daysBetween(isoStr) {
  if (!isoStr) return 0;
  const parts = String(isoStr).split("-").map(Number);
  if (parts.length !== 3) return 0;
  const due = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = today.getTime() - due.getTime();
  return Math.floor(diff / 86400000);
}

/**
 * Items the user owes right now — current-round contributions across all
 * vaults the user is a member of, where their status isn't "paid".
 * Sorted overdue-first, then by nearest due date.
 *
 * @param {any[]} vaults
 * @param {any[]} payments
 * @param {{ id: string }} user
 */
export function getDuePaymentsForUser(vaults, payments, user) {
  const out = [];
  for (const v of vaults) {
    if (v.status !== "active") continue;
    const um = getUserMember(v, user.id);
    if (!um) continue;
    const statuses = v.paymentStatusesByRound?.[String(v.currentRound)] ?? {};
    const status = statuses[um.id];
    if (status === "paid") continue;

    const explicit = payments.find(
      (p) =>
        p.vaultId === v.id &&
        p.memberId === um.id &&
        p.round === v.currentRound,
    );

    const range = getRoundDateRange(v, v.currentRound);
    const dueDate =
      explicit?.dueDate ??
      (range?.end ? dateToIsoLocal(range.end) : null) ??
      "2026-05-31";
    const overdueDays = isDueDateOverdue(dueDate) ? daysBetween(dueDate) : 0;

    out.push({
      id: explicit?.id ?? `due-${v.id}-${um.id}-${v.currentRound}`,
      vaultId: v.id,
      vaultName: v.name,
      memberId: um.id,
      memberCount: v.memberCount,
      amount: v.contributionAmount,
      contributionPeriod: v.contributionPeriod,
      dueDate,
      overdueDays,
      round: v.currentRound,
      totalRounds: v.totalRounds,
    });
  }

  out.sort((a, b) => {
    if (a.overdueDays > 0 && b.overdueDays === 0) return -1;
    if (b.overdueDays > 0 && a.overdueDays === 0) return 1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return out;
}

/**
 * Reconstruct user history rows across all vaults: every contribution they
 * made in past rounds + every payout they received.
 *
 * @param {any[]} vaults
 * @param {{ id: string }} user
 */
export function getHistoryForUser(vaults, user) {
  const rows = [];

  for (const v of vaults) {
    const um = getUserMember(v, user.id);
    if (!um) continue;

    const lastRound =
      v.status === "completed" ? v.totalRounds : v.currentRound - 1;

    for (let r = 1; r <= lastRound; r++) {
      const range = getRoundDateRange(v, r);
      // Use the round's local end-of-period date for stability; if the
      // vault has no startDate we fall back to a deterministic placeholder
      // (never `new Date()` during render — that breaks hydration).
      const dateStr = range?.end
        ? dateToIsoLocal(range.end)
        : v.startDate ?? "2026-01-01";
      const status =
        v.paymentStatusesByRound?.[String(r)]?.[um.id] ?? "paid";
      rows.push({
        id: `c-${v.id}-${r}`,
        kind: "contribution",
        vaultId: v.id,
        vaultName: v.name,
        round: r,
        totalRounds: v.totalRounds,
        amount: v.contributionAmount,
        date: dateStr,
        status,
      });

      if (um.payoutOrder === r) {
        rows.push({
          id: `p-${v.id}-${r}`,
          kind: "payout",
          vaultId: v.id,
          vaultName: v.name,
          round: r,
          totalRounds: v.totalRounds,
          amount: v.contributionAmount * v.memberCount,
          date: dateStr,
          status: "received",
        });
      }
    }
  }

  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows;
}

/**
 * Aggregate counts for the profile screen.
 * @param {any[]} vaults
 * @param {{ id: string }} user
 */
export function getProfileAggregates(vaults, user) {
  let totalContributed = 0;
  let totalReceived = 0;
  let onTime = 0;
  let missed = 0;
  let vaultsCompleted = 0;
  let vaultsJoined = 0;

  for (const v of vaults) {
    const um = getUserMember(v, user.id);
    if (!um) continue;
    vaultsJoined += 1;
    if (v.status === "completed") vaultsCompleted += 1;

    const lastRound =
      v.status === "completed" ? v.totalRounds : v.currentRound - 1;

    for (let r = 1; r <= lastRound; r++) {
      const status =
        v.paymentStatusesByRound?.[String(r)]?.[um.id] ?? "paid";
      if (status === "paid") {
        totalContributed += v.contributionAmount;
        onTime += 1;
      } else if (status === "late") {
        totalContributed += v.contributionAmount;
        missed += 1;
      }
      if (um.payoutOrder === r) {
        totalReceived += v.contributionAmount * v.memberCount;
      }
    }
  }

  const reliability =
    onTime + missed === 0 ? 100 : Math.round((onTime / (onTime + missed)) * 100);

  return {
    totalContributed,
    totalReceived,
    onTime,
    missed,
    vaultsCompleted,
    vaultsJoined,
    reliability,
  };
}
