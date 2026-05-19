"use client";

import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";

export function WrongNetworkBanner() {
  const { isConnected, isBase, switchToBase, isSwitching } =
    useWalletConnection();

  if (!isConnected || isBase) return null;

  return (
    <div className="fixed left-1/2 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-50 w-full max-w-[430px] -translate-x-1/2 px-4">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-[#DC2626] px-4 py-3 shadow-lg">
      <p className="text-sm font-medium text-white">
        Wrong network. Please switch to Base mainnet.
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="shrink-0 bg-white text-[#DC2626] hover:bg-white/90"
        onClick={switchToBase}
        disabled={isSwitching}
      >
        {isSwitching ? "Switching…" : "Switch to Base"}
      </Button>
    </div>
    </div>
  );
}
