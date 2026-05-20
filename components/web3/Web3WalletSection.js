"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Copy, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { MobileWalletLinks } from "@/components/web3/MobileWalletLinks";
import { UsdcOnrampSheet } from "@/components/web3/UsdcOnrampSheet";
import { Web3OnboardingSheet } from "@/components/web3/Web3OnboardingSheet";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { useUSDCBalance } from "@/lib/web3/hooks/useUSDCBalance";
import { useWalletOnChainActivity } from "@/lib/web3/hooks/useWalletOnChainActivity";
import { hasSeenWeb3Onboarding } from "@/lib/web3/web3Prefs";
import { hasInjectedWallet, isMobileBrowser } from "@/lib/web3/deepLinks";
import { toast } from "@/components/ui/toast";
import {
  basescanAddressUrl,
  basescanTxUrl,
  formatUsdc,
  truncateAddress,
} from "@/lib/web3/utils";
import { formatDate } from "@/lib/utils";
import { useDisconnect } from "wagmi";
import { useProfile } from "@/hooks/useProfile";

function BaseBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0052FF]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0052FF]">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0052FF] text-[8px] font-bold text-white">
        B
      </span>
      Base Mainnet
    </span>
  );
}

export function Web3WalletSection() {
  const { isConnected, address } = useWalletConnection();
  const { formatted } = useUSDCBalance();
  const { disconnect } = useDisconnect();
  const activity = useWalletOnChainActivity();
  const { openConnectModal } = useConnectModal();
  const { profile, updateProfile } = useProfile();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onrampOpen, setOnrampOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState(false);
  const previousAddress = useRef(null);

  useEffect(() => {
    if (!isConnected && !hasSeenWeb3Onboarding()) {
      setOnboardingOpen(true);
    }
  }, [isConnected]);

  // If the user kicks off "Change Wallet", we wait for the next connected
  // address (which differs from the profile's stored one) and save it.
  useEffect(() => {
    if (!pendingChange) return;
    if (!isConnected || !address) return;
    if (!profile) return;
    if (
      profile.walletAddress &&
      profile.walletAddress.toLowerCase() === address.toLowerCase()
    ) {
      setPendingChange(false);
      return;
    }
    (async () => {
      const res = await updateProfile({ walletAddress: address });
      setPendingChange(false);
      if (res?.error) {
        toast(`Couldn't update profile: ${res.error}`, { variant: "error" });
      } else {
        toast("Profile wallet updated", { variant: "success" });
      }
    })();
  }, [pendingChange, isConnected, address, profile, updateProfile]);

  useEffect(() => {
    previousAddress.current = address;
  }, [address]);

  const walletMismatch =
    isConnected &&
    address &&
    profile?.walletAddress &&
    profile.walletAddress.toLowerCase() !== address.toLowerCase();

  const startChangeWallet = () => {
    setChangeOpen(false);
    setPendingChange(true);
    try {
      disconnect();
    } catch {
      /* ignore */
    }
    setTimeout(() => openConnectModal?.(), 300);
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast("Address copied", { variant: "success" });
    } catch {
      toast("Could not copy", { variant: "error" });
    }
  };

  const startConnect = () => {
    if (!hasSeenWeb3Onboarding()) {
      setOnboardingOpen(true);
      return;
    }
    openConnectModal?.();
  };

  if (!isConnected) {
    const showMobileLinks = isMobileBrowser() && !hasInjectedWallet();

    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Web3 Wallet</h3>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0052FF]/10 text-xl">
              🔷
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                Connect your Base wallet
              </p>
              <p className="text-xs text-[#6B7280]">
                Pay contributions with USDC on Base
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={() => setOnboardingOpen(true)}
            >
              What is a Base wallet?
            </Button>
            <ConnectWalletButton onBeforeConnect={startConnect} />
          </div>
          {showMobileLinks ? (
            <div className="mt-3">
              <MobileWalletLinks />
            </div>
          ) : null}
        </div>

        <Web3OnboardingSheet
          open={onboardingOpen}
          onClose={() => setOnboardingOpen(false)}
          onConnect={() => openConnectModal?.()}
        />
      </section>
    );
  }

  const displayBalance = formatted.replace(" USDC", "");

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-[#1A1A1A]">Web3 Wallet</h3>
      <div className="rounded-2xl border border-[#1B5E20]/20 bg-gradient-to-br from-[#1B5E20]/[0.06] to-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={copyAddress}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-mono text-xs font-medium text-[#1A1A1A] shadow-sm"
          >
            {truncateAddress(address)}
            <Copy className="h-3.5 w-3.5 text-[#6B7280]" />
          </button>
          <BaseBadge />
        </div>

        <p className="mt-4 text-3xl font-bold tracking-tight text-[#1A1A1A]">
          {displayBalance}
        </p>
        <p className="text-xs font-medium text-[#6B7280]">USDC on Base</p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => setOnrampOpen(true)}
        >
          Get USDC
        </Button>

        <Link
          href={basescanAddressUrl(address) ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-semibold text-[#1B5E20]"
        >
          View on Basescan →
        </Link>

        {walletMismatch ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
            <div className="flex-1">
              <p className="font-medium text-[#991B1B]">
                Connected wallet doesn&apos;t match your profile
              </p>
              <p className="mt-0.5 text-[#6B7280]">
                Profile: {truncateAddress(profile?.walletAddress)} · Connected:{" "}
                {truncateAddress(address)}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setChangeOpen(true)}
              >
                Update profile wallet
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setChangeOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B5E20]"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Change wallet
          </button>
          <button
            type="button"
            onClick={() => disconnect()}
            className="text-sm font-medium text-[#DC2626]"
          >
            Disconnect
          </button>
        </div>
      </div>

      <ChangeWalletSheet
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        onConfirm={startChangeWallet}
      />

      <UsdcOnrampSheet
        open={onrampOpen}
        onClose={() => setOnrampOpen(false)}
        walletAddress={address}
      />

      {activity.isConfigured ? (
        <>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              On-chain stats
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Vaults on Base" value={String(activity.vaultCount)} />
              <Stat
                label="Transactions"
                value={String(activity.txCount)}
              />
              <Stat
                label="USDC contributed"
                value={formatUsdc(activity.totalContributed).replace(
                  " USDC",
                  "",
                )}
              />
              <Stat
                label="USDC received"
                value={formatUsdc(activity.totalReceived).replace(
                  " USDC",
                  "",
                )}
              />
            </div>
          </div>

          {activity.recentEvents.length > 0 ? (
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Recent on-chain activity
              </p>
              <ul className="mt-3 space-y-2">
                {activity.recentEvents.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#1A1A1A]">
                        {e.description}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">
                        {e.blockTimestamp
                          ? formatDate(new Date(e.blockTimestamp * 1000), {
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-[#1B5E20]">
                        {e.amountFormatted || "—"}
                      </p>
                      {e.txHash ? (
                        <Link
                          href={basescanTxUrl(e.txHash) ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#1B5E20]"
                        >
                          Basescan
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-[#6B7280]">{label}</p>
      <p className="font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function ChangeWalletSheet({ open, onClose, onConfirm }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Change profile wallet">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-[#FFC107]/40 bg-[#FFFBEB] p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#92400E]" />
          <div className="text-sm text-[#4B5563]">
            <p className="font-semibold text-[#92400E]">
              This affects vaults where you are a custodian
            </p>
            <p className="mt-1">
              Other custodians will need to re-verify your new wallet before
              you can sign for disbursements. Make sure you have backed up
              your new wallet&apos;s recovery phrase and that other vault
              members know you&apos;re switching.
            </p>
          </div>
        </div>
        <p className="text-xs text-[#6B7280]">
          We&apos;ll disconnect your current wallet, prompt you to connect a
          new one, and update your KatangaX profile with the new address.
        </p>
        <Button type="button" className="w-full" size="lg" onClick={onConfirm}>
          Continue — disconnect & reconnect
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </BottomSheet>
  );
}
