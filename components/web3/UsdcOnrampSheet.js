"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { getCoinbaseOnrampUrl } from "@/lib/web3/onramp";

/**
 * @param {{ open: boolean, onClose: () => void, walletAddress?: string }} props
 */
export function UsdcOnrampSheet({ open, onClose, walletAddress }) {
  const url = walletAddress ? getCoinbaseOnrampUrl(walletAddress) : null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Get USDC" className="!max-h-[85vh]">
      <p className="mb-3 text-xs text-[#6B7280]">
        Buy USDC on Base via Coinbase. Your wallet address is pre-filled.
      </p>
      {url ? (
        <iframe
          title="Coinbase Onramp"
          src={url}
          className="h-[min(70vh,520px)] w-full rounded-xl border border-border"
          allow="payment"
        />
      ) : (
        <p className="text-sm text-[#DC2626]">Connect a wallet first.</p>
      )}
    </BottomSheet>
  );
}
