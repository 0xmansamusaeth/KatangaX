"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import {
  formatCurrency,
  formatDate,
  getPeriodLabel,
  resolveMemberDisplay,
} from "@/lib/utils";

const PAYOUT_METHOD_LABELS = {
  random: "Random Draw",
  fixed: "Fixed Order",
  bidding: "Bidding",
};

export function RulesTab({ vault }) {
  const { user } = useUser();
  const accepted = (vault.members ?? []).filter((m) => m.agreementAccepted);
  const pending = (vault.members ?? []).filter((m) => !m.agreementAccepted);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">
          Vault description
        </h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#4B5563]">
          {vault.description?.trim()
            ? vault.description
            : "No description provided by the organiser."}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Key details</h3>
        <dl className="mt-3 divide-y divide-[#F3F4F6]">
          <RuleRow
            label="Amount"
            value={formatCurrency(vault.contributionAmount)}
          />
          <RuleRow
            label="Frequency"
            value={getPeriodLabel(vault.contributionPeriod)}
          />
          <RuleRow
            label="Payout order"
            value={
              PAYOUT_METHOD_LABELS[vault.payoutOrderMethod] ??
              vault.payoutOrderMethod ??
              "—"
            }
          />
          <RuleRow
            label="Start date"
            value={
              vault.startDate
                ? formatDate(vault.startDate, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
          />
          <RuleRow
            label="Created by"
            value={vault.createdBy ?? "—"}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">
          Member agreement status
        </h3>
        <p className="mt-1 text-xs text-[#6B7280]">
          {accepted.length} of {vault.members?.length ?? 0} have accepted the
          vault terms.
        </p>
        <ul className="mt-3 space-y-2">
          {(vault.members ?? []).map((m) => {
            const display = resolveMemberDisplay(m, user);
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-[#F5F7F5] p-2"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: display.avatarColor }}
                >
                  {display.initials}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm text-[#1A1A1A]">
                  {display.name}
                  {display.isYou ? " (You)" : ""}
                </p>
                {m.agreementAccepted ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accepted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#D97706]">
                    <Clock className="h-3.5 w-3.5" />
                    Pending
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {pending.length === 0 ? null : (
          <p className="mt-2 text-[11px] text-[#6B7280]">
            {pending.length} member{pending.length === 1 ? "" : "s"} still need
            to accept.
          </p>
        )}
      </section>
    </div>
  );
}

function RuleRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="font-medium text-[#1A1A1A]">{value}</dd>
    </div>
  );
}
