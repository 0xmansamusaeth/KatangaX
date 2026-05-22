"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { truncateAddress } from "@/lib/web3/utils";
import { toast } from "@/components/ui/toast";

const WALLET_OPTIONS = [
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Recommended for Base & USDC",
    badge: "Recommended",
    emoji: "🔵",
  },
  {
    id: "metamask",
    name: "MetaMask",
    description: "Popular browser & mobile wallet",
    emoji: "🦊",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Connect any compatible wallet",
    emoji: "🔗",
  },
];

export default function ConnectWalletPage() {
  return (
    <Suspense fallback={null}>
      <ConnectWalletPageInner />
    </Suspense>
  );
}

function ConnectWalletPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, updateProfile, loading } = useProfile();
  const { address, isConnected } = useWalletConnection();
  const [saved, setSaved] = useState(false);

  const next = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);

  useEffect(() => {
    if (!isConnected || !address || saved || loading) return;

    (async () => {
      const { error } = await updateProfile({
        walletAddress: address,
        isCustodianEligible: true,
      });
      if (error) {
        toast(error, { variant: "error" });
        return;
      }
      setSaved(true);
      toast("Wallet connected!", { variant: "success" });
    })();
  }, [isConnected, address, saved, loading, updateProfile]);

  return (
    <main className="min-h-screen px-6 pb-24 pt-8">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Connect Your Base Wallet</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
        Your wallet is your identity on KatangaX. You need it to participate in
        vaults and make contributions.
      </p>

      <ul className="mt-6 space-y-3">
        {WALLET_OPTIONS.map((w) => (
          <li
            key={w.id}
            className="rounded-xl border border-border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{w.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[#1A1A1A]">{w.name}</p>
                  {w.badge ? (
                    <span className="rounded-full bg-[#1B5E20]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B5E20]">
                      {w.badge}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-[#6B7280]">{w.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={!mounted}
              onClick={openConnectModal}
            >
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
      </div>

      {saved && address ? (
        <div className="mt-6 rounded-xl bg-[#16A34A]/10 p-4 text-center">
          <p className="text-sm font-semibold text-[#166534]">
            Wallet connected! {truncateAddress(address)}
          </p>
          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={() => router.push(next)}
          >
            Continue →
          </Button>
        </div>
      ) : null}

      <button
        type="button"
        className="mt-8 w-full text-center text-xs text-[#6B7280] underline"
        onClick={() => router.push(next)}
      >
        Skip for now — I&apos;ll connect later
      </button>
    </main>
  );
}
