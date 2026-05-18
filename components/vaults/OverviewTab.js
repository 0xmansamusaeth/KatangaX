"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Star, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ContributeNowSheet } from "@/components/vaults/ContributeNowSheet";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import {
  cn,
  getTrustScore,
  resolveMemberDisplay,
} from "@/lib/utils";

const STATUS_META = {
  paid: { Icon: CheckCircle2, color: "text-[#16A34A]", label: "Paid" },
  pending: { Icon: Clock, color: "text-[#D97706]", label: "Pending" },
  late: { Icon: XCircle, color: "text-[#DC2626]", label: "Late" },
};

export function OverviewTab({ vault }) {
  const { user } = useUser();
  const { markContribution } = useVaults();
  const [sheetOpen, setSheetOpen] = useState(false);

  const userMember = useMemo(
    () => vault.members?.find((m) => m.userId === user.id) ?? null,
    [vault, user.id],
  );

  const currentRoundKey = String(vault.currentRound);
  const statuses = vault.paymentStatusesByRound?.[currentRoundKey] ?? {};
  const userStatus = userMember ? statuses[userMember.id] : null;

  const showContributeButton =
    vault.status === "active" && userMember && userStatus !== "paid";

  const confirmPayment = () => {
    if (!userMember) return;
    markContribution(vault.id, userMember.id, vault.currentRound, "paid");
    setSheetOpen(false);
    toast("Contribution confirmed. Thank you!");
  };

  return (
    <div className="space-y-5">
      {showContributeButton ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => setSheetOpen(true)}
        >
          Contribute Now
        </Button>
      ) : null}

      {userMember && userStatus === "paid" ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-3 text-sm font-medium text-[#166534]">
          <CheckCircle2 className="h-5 w-5" />
          You’ve paid this round.
        </div>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">
          Members ({vault.members?.length ?? 0})
        </h3>
        <ul className="space-y-2">
          {vault.members.map((m) => {
            const status = statuses[m.id] ?? "pending";
            const meta = STATUS_META[status] ?? STATUS_META.pending;
            const isOrganiser = m.id === vault.organiserId;
            const display = resolveMemberDisplay(m, user);
            const trust = getTrustScore(m.id);
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: display.avatarColor }}
                >
                  {display.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">
                      {display.name}
                      {display.isYou ? (
                        <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-[#1B5E20]">
                          (You)
                        </span>
                      ) : null}
                    </p>
                    {isOrganiser ? (
                      <span className="rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#92400E]">
                        Organiser
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <Star
                      className="h-3 w-3 fill-[#FFC107] text-[#FFC107]"
                      strokeWidth={1.5}
                    />
                    <span className="font-medium text-[#4B5563]">
                      {trust.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] font-medium text-[#6B7280]">
                    Payout #{m.payoutOrder}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-[11px] font-semibold",
                      meta.color,
                    )}
                  >
                    <meta.Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <ContributeNowSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        vault={vault}
        onConfirm={confirmPayment}
      />
    </div>
  );
}
