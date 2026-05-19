"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { markWeb3OnboardingSeen } from "@/lib/web3/web3Prefs";

const SCREENS = [
  {
    headline: "What is a Base Wallet?",
    emoji: "📱",
    title: "Your money, your control",
    body: "A Base wallet lets you send and receive USDC — a digital dollar — directly, with no bank needed.",
    cta: "Next →",
  },
  {
    headline: "What is USDC?",
    emoji: "💵",
    title: "1 USDC = 1 US Dollar",
    body: "USDC is a stablecoin. Its value doesn't change. When you contribute 10 USDC to a vault, that's always $10.",
    cta: "Next →",
  },
  {
    headline: "Gas fees on Base",
    emoji: "⛽",
    title: "Tiny fees, big savings",
    body: "Base charges a tiny fee (usually less than $0.01) for each transaction. You'll need a small amount of ETH in your wallet for this.",
    cta: "Got it — Connect Wallet",
  },
];

/**
 * @param {{ open: boolean, onClose: () => void, onConnect: () => void }} props
 */
export function Web3OnboardingSheet({ open, onClose, onConnect }) {
  const [screen, setScreen] = useState(0);
  const current = SCREENS[screen];
  const isLast = screen === SCREENS.length - 1;

  const finish = () => {
    markWeb3OnboardingSeen();
    onClose();
    if (isLast) onConnect();
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setScreen((s) => s + 1);
  };

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        markWeb3OnboardingSeen();
        onClose();
      }}
      title={current.headline}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0052FF]/10 text-4xl">
          {current.emoji}
        </div>
        <h4 className="mt-4 text-lg font-bold text-[#1A1A1A]">{current.title}</h4>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{current.body}</p>
        <div className="mt-4 flex gap-1.5">
          {SCREENS.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === screen ? "w-6 bg-[#1B5E20]" : "w-1.5 bg-[#E5E7EB]")
              }
            />
          ))}
        </div>
        <Button type="button" className="mt-6 w-full" size="lg" onClick={next}>
          {current.cta}
        </Button>
      </div>
    </BottomSheet>
  );
}
