"use client";

import { Smartphone } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency, getPeriodLabel } from "@/lib/utils";

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   payment: {
 *     vaultName: string,
 *     round: number,
 *     totalRounds: number,
 *     amount: number,
 *     contributionPeriod: string,
 *   } | null,
 *   onConfirm: () => void,
 * }} props
 */
export function PaymentConfirmSheet({ isOpen, onClose, payment, onConfirm }) {
  if (!payment) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Confirm payment">
      <div className="space-y-3">
        <div className="rounded-xl bg-[#F5F7F5] p-4">
          <p className="text-xs uppercase tracking-wide text-[#6B7280]">
            Vault
          </p>
          <p className="text-base font-semibold text-[#1A1A1A]">
            {payment.vaultName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#F5F7F5] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Round
            </p>
            <p className="text-base font-semibold text-[#1A1A1A]">
              {payment.round} / {payment.totalRounds}
            </p>
          </div>
          <div className="rounded-xl bg-[#F5F7F5] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Frequency
            </p>
            <p className="text-base font-semibold text-[#1A1A1A]">
              {getPeriodLabel(payment.contributionPeriod)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-[#1B5E20]/15 bg-[#1B5E20]/[0.04] p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-[#1B5E20]">
            Amount due
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1A1A1A]">
            {formatCurrency(payment.amount)}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFC107]/20 text-[#92400E]">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Payment method
            </p>
            <p className="text-sm font-medium text-[#1A1A1A]">
              MTN Mobile Money
            </p>
          </div>
          <span className="rounded-full bg-[#1B5E20]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1B5E20]">
            Default
          </span>
        </div>

        <Button type="button" size="lg" className="w-full" onClick={onConfirm}>
          Confirm Payment
        </Button>
        <p className="text-center text-[11px] text-[#6B7280]">
          You can dispute any contribution within 24 hours.
        </p>
      </div>
    </BottomSheet>
  );
}
