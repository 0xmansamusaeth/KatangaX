"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { dismissSignatureExplainer } from "@/lib/web3/web3Prefs";
import { formatUsdc } from "@/lib/web3/utils";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onContinue: () => void,
 *   recipientName: string,
 *   amount?: bigint,
 * }} props
 */
export function SignatureExplainerSheet({
  open,
  onClose,
  onContinue,
  recipientName,
  amount,
}) {
  const [dontShow, setDontShow] = useState(false);
  const amountLabel = amount != null ? formatUsdc(amount) : "the round pot";

  const handleContinue = () => {
    if (dontShow) dismissSignatureExplainer();
    onContinue();
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="What am I signing?">
      <p className="text-sm leading-relaxed text-[#6B7280]">
        You&apos;re approving the payout of {amountLabel} to{" "}
        <span className="font-semibold text-[#1A1A1A]">{recipientName}</span>.
        This requires 3 members to sign. Nothing leaves the contract until 3
        approvals are collected.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm text-[#4B5563]">
        <Checkbox checked={dontShow} onCheckedChange={setDontShow} />
        Don&apos;t show this again
      </label>
      <Button type="button" className="mt-4 w-full" size="lg" onClick={handleContinue}>
        Continue to Sign
      </Button>
    </BottomSheet>
  );
}
