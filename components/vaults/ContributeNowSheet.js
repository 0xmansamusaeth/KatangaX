"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency, getPeriodLabel } from "@/lib/utils";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   vault: any,
 *   onConfirm: () => void,
 * }} props
 */
export function ContributeNowSheet({ open, onClose, vault, onConfirm }) {
  if (!vault) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Confirm contribution">
      <div className="space-y-3">
        <div className="rounded-xl bg-[#F5F7F5] p-4">
          <p className="text-xs uppercase tracking-wide text-[#6B7280]">
            Vault
          </p>
          <p className="text-base font-semibold text-[#1A1A1A]">{vault.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#F5F7F5] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Round
            </p>
            <p className="text-base font-semibold text-[#1A1A1A]">
              {vault.currentRound} / {vault.totalRounds}
            </p>
          </div>
          <div className="rounded-xl bg-[#F5F7F5] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Frequency
            </p>
            <p className="text-base font-semibold text-[#1A1A1A]">
              {getPeriodLabel(vault.contributionPeriod)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-[#1B5E20]/15 bg-[#1B5E20]/[0.04] p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-[#1B5E20]">
            Amount due
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1A1A1A]">
            {formatCurrency(vault.contributionAmount)}
          </p>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={onConfirm}
          size="lg"
        >
          Confirm Payment of {formatCurrency(vault.contributionAmount)}
        </Button>
        <p className="text-center text-[11px] text-[#6B7280]">
          You can dispute any contribution within 24 hours of confirmation.
        </p>
      </div>
    </BottomSheet>
  );
}
