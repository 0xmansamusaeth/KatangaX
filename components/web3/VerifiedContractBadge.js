"use client";

import { useState } from "react";
import { VerifiedContractSheet } from "@/components/web3/VerifiedContractSheet";

/**
 * @param {{ contractAddress: string }} props
 */
export function VerifiedContractBadge({ contractAddress }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-[#16A34A]/15 px-2.5 py-1 text-[10px] font-semibold text-[#166534]"
      >
        ✅ Verified Contract
      </button>
      <VerifiedContractSheet
        open={open}
        onClose={() => setOpen(false)}
        contractAddress={contractAddress}
      />
    </>
  );
}
