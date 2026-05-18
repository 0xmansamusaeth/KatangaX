"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import {
  formatCurrency,
  formatDate,
  getRoundDateRange,
  resolveMemberDisplay,
} from "@/lib/utils";

const STATUS_META = {
  paid: { Icon: CheckCircle2, color: "text-[#16A34A]", label: "You paid" },
  pending: { Icon: Clock, color: "text-[#D97706]", label: "Pending" },
  late: { Icon: XCircle, color: "text-[#DC2626]", label: "Late" },
};

export function HistoryTab({ vault }) {
  const { user } = useUser();
  const userMember = useMemo(
    () => vault.members?.find((m) => m.userId === user.id) ?? null,
    [vault, user.id],
  );

  const completedRounds = useMemo(() => {
    const total =
      vault.status === "completed" ? vault.totalRounds : vault.currentRound - 1;
    return Array.from({ length: Math.max(0, total) }, (_, i) => i + 1);
  }, [vault.status, vault.currentRound, vault.totalRounds]);

  if (completedRounds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#1A1A1A]">No history yet</p>
        <p className="mt-1 text-xs text-[#6B7280]">
          Past rounds will appear here once contributions are completed.
        </p>
      </div>
    );
  }

  const pot = vault.contributionAmount * vault.memberCount;

  return (
    <ul className="space-y-3">
      {completedRounds
        .slice()
        .reverse()
        .map((roundNum) => {
          const range = getRoundDateRange(vault, roundNum);
          const recipient =
            vault.members?.find((m) => m.payoutOrder === roundNum) ??
            vault.members?.[0];
          const display = resolveMemberDisplay(recipient, user);
          const statuses =
            vault.paymentStatusesByRound?.[String(roundNum)] ?? {};
          const userStatus = userMember
            ? statuses[userMember.id] ?? "pending"
            : null;
          const meta = userStatus ? STATUS_META[userStatus] : null;

          return (
            <li
              key={roundNum}
              className="rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    Round {roundNum}
                  </p>
                  {range ? (
                    <p className="text-xs text-[#6B7280]">
                      {formatDate(range.begin, {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      –{" "}
                      {formatDate(range.end, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-bold text-[#1B5E20]">
                  {formatCurrency(pot)}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F5F7F5] p-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: display.avatarColor }}
                >
                  {display.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">
                    Recipient
                  </p>
                  <p className="truncate text-sm font-medium text-[#1A1A1A]">
                    {display.name}
                    {display.isYou ? " (You)" : ""}
                  </p>
                </div>
                {meta ? (
                  <span
                    className={`flex shrink-0 items-center gap-1 text-[11px] font-semibold ${meta.color}`}
                  >
                    <meta.Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
    </ul>
  );
}
