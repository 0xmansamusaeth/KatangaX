"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MobileWalletLinks } from "@/components/web3/MobileWalletLinks";
import { hasInjectedWallet, isMobileBrowser } from "@/lib/web3/deepLinks";
import { Copy, ExternalLink, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useUSDCBalance } from "@/lib/web3/hooks/useUSDCBalance";
import {
  basescanAddressUrl,
  truncateAddress,
} from "@/lib/web3/utils";

function BaseLogo({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="12" fill="#0052FF" />
      <path
        fill="#fff"
        d="M12 6.5c-2.2 0-4 1.35-4 3.02 0 .98.58 1.85 1.48 2.38l-.9 1.55c-1.28-.74-2.08-2.05-2.08-3.48 0-2.35 2.24-4.25 5-4.25s5 1.9 5 4.25c0 1.43-.8 2.74-2.08 3.48l-.9-1.55c.9-.53 1.48-1.4 1.48-2.38 0-1.67-1.8-3.02-4-3.02z"
      />
    </svg>
  );
}

export function ConnectWalletButton({
  className,
  fullWidth = true,
  onBeforeConnect,
}) {
  const [open, setOpen] = useState(false);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openAccountModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          const showMobile =
            isMobileBrowser() && !hasInjectedWallet();
          return (
            <div className={fullWidth ? "w-full space-y-2" : "space-y-2"}>
              <Button
                type="button"
                className={
                  (fullWidth ? "w-full " : "") +
                  "gap-2 rounded-xl bg-[#1B5E20] text-white hover:bg-[#145214] " +
                  (className ?? "")
                }
                onClick={() => {
                  if (onBeforeConnect) onBeforeConnect();
                  else openConnectModal?.();
                }}
              >
                <BaseLogo className="h-5 w-5" />
                <Wallet className="h-4 w-4" />
                Connect Base Wallet
              </Button>
              {showMobile ? <MobileWalletLinks /> : null}
            </div>
          );
        }

        return (
          <ConnectedWalletMenu
            account={account}
            chain={chain}
            open={open}
            setOpen={setOpen}
            onOpenAccount={openAccountModal}
            className={className}
            fullWidth={fullWidth}
          />
        );
      }}
    </ConnectButton.Custom>
  );
}

function ConnectedWalletMenu({
  account,
  chain,
  open,
  setOpen,
  onOpenAccount,
  className,
  fullWidth,
}) {
  const { formatted } = useUSDCBalance(account.address);
  const short = truncateAddress(account.address);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account.address);
      toast("Address copied", { variant: "success" });
    } catch {
      toast("Could not copy address", { variant: "error" });
    }
  };

  return (
    <div className={"relative " + (fullWidth ? "w-full" : "")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "flex w-full items-center justify-between gap-2 rounded-xl border border-[#1B5E20]/30 bg-[#1B5E20] px-4 py-3 text-left text-white shadow-sm " +
          (className ?? "")
        }
      >
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4ADE80]" aria-hidden />
          <span className="text-sm font-semibold">{short}</span>
        </span>
        <span className="text-xs font-medium text-white/90">{formatted}</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs text-[#6B7280]">Wallet</p>
              <p className="mt-0.5 flex items-center gap-2 font-mono text-sm text-[#1A1A1A]">
                {account.displayName ?? short}
                <button
                  type="button"
                  onClick={copyAddress}
                  className="text-[#1B5E20]"
                  aria-label="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </p>
              <p className="mt-2 text-sm font-semibold text-[#1B5E20]">
                {formatted}
              </p>
            </div>
            <div className="p-2">
              <a
                href={basescanAddressUrl(account.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F5F7F5]"
              >
                <ExternalLink className="h-4 w-4" />
                View on Basescan
              </a>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenAccount?.();
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#DC2626] hover:bg-[#DC2626]/5"
              >
                Disconnect
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Compact connect CTA for inline forms */
export function ConnectWalletInline() {
  return <ConnectWalletButton fullWidth className="mt-2" />;
}
