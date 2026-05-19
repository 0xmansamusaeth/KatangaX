"use client";

import Link from "next/link";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { basescanAddressUrl } from "@/lib/web3/utils";

/**
 * @param {{ open: boolean, onClose: () => void, contractAddress: string }} props
 */
export function VerifiedContractSheet({ open, onClose, contractAddress }) {
  const explorer = basescanAddressUrl(contractAddress);

  return (
    <BottomSheet open={open} onClose={onClose} title="Verified contract">
      <ul className="space-y-3 text-sm text-[#4B5563]">
        <li>✓ This vault&apos;s funds are held by a smart contract on Base</li>
        <li>✓ Only vault members can trigger disbursements</li>
        <li>✓ 3 member signatures are required for any payout</li>
      </ul>
      {explorer ? (
        <Link
          href={`${explorer}#code`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-[#1B5E20]"
        >
          View contract code on Basescan →
        </Link>
      ) : null}
    </BottomSheet>
  );
}
