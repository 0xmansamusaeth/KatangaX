"use client";

import { useMemo, useState } from "react";
import { MemberRow } from "@/components/vaults/MemberRow";

export function RoundPaymentsPanel({ vault }) {
  const roundKeys = useMemo(() => {
    const keys = Object.keys(vault.paymentStatusesByRound ?? {}).map(Number);
    keys.sort((a, b) => a - b);
    return keys;
  }, [vault.paymentStatusesByRound]);

  const defaultRound = roundKeys.length
    ? roundKeys.includes(vault.currentRound)
      ? vault.currentRound
      : roundKeys[0]
    : vault.currentRound ?? 1;

  const [selected, setSelected] = useState(defaultRound);

  const statuses = vault.paymentStatusesByRound?.[String(selected)] ?? {};

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {roundKeys.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelected(r)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selected === r
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-secondary"
            }`}
          >
            Round {r}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {vault.members.map((m) => (
          <MemberRow
            key={`${selected}-${m.id}`}
            member={m}
            paymentStatus={statuses[m.id] ?? "pending"}
          />
        ))}
      </div>
    </div>
  );
}
