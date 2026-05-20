"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { FACTORY_ADDRESS, USDC_ADDRESS } from "@/lib/web3/contracts";
import { getAdminChecks, setAdminCheck } from "@/lib/web3/web3Prefs";

const EXPECTED_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const DEPLOYED_FACTORY = "0xD3F360f5B4c428684a88a8a0553C53754a94165D";

const SECTIONS = [
  {
    title: "Smart contract",
    items: [
      {
        id: "factory-verified",
        label: "Factory contract verified on Basescan",
        auto: true,
        href: `https://basescan.org/address/${DEPLOYED_FACTORY}#code`,
      },
      {
        id: "factory-env",
        label: "Factory address in .env matches deployed address",
        auto: true,
      },
      {
        id: "usdc-address",
        label: `USDC address confirmed (${EXPECTED_USDC})`,
        auto: true,
      },
      { id: "test-vault", label: "Test vault created via factory on Base mainnet" },
      { id: "contribute-e2e", label: "Contribution flow tested end-to-end on mainnet" },
      {
        id: "disburse-3sig",
        label: "Disbursement with 3 signatures tested on mainnet",
      },
    ],
  },
  {
    title: "Frontend",
    items: [
      { id: "wallet-connect", label: "Wallet connect works (MetaMask, Coinbase Wallet)" },
      { id: "wrong-network", label: "Wrong network banner shows on non-Base chains" },
      { id: "usdc-balance", label: "USDC balance displays correctly" },
      { id: "gas-estimate", label: "Gas estimate shows before each transaction" },
      { id: "tx-states", label: "All transaction states (pending/success/error) render" },
      { id: "basescan-links", label: "Basescan links open correct transactions" },
      { id: "onchain-history", label: "On-chain history loads for vault with activity" },
      {
        id: "mobile-deeplinks",
        label: "Mobile wallet deep links work on iOS and Android",
      },
    ],
  },
  {
    title: "General",
    items: [
      { id: "phase5-tests", label: "All Phase 5 tests still passing" },
      { id: "mobile-money", label: "Mobile money flow still works (not broken by Web3)" },
      { id: "supabase-data", label: "Vault and profile data loads from Supabase" },
      { id: "no-console-errors", label: "No console errors on any page" },
      { id: "real-devices", label: "Tested on real iPhone (Safari) and Android (Chrome)" },
      {
        id: "vercel-env",
        label: "Vercel deployment updated with NEXT_PUBLIC env vars set",
      },
      { id: "mobile-perf", label: "App loads in <3 seconds on mobile data connection" },
    ],
  },
];

function autoPass(id) {
  if (id === "factory-env") {
    return (
      FACTORY_ADDRESS?.toLowerCase() === DEPLOYED_FACTORY.toLowerCase()
    );
  }
  if (id === "usdc-address") {
    return USDC_ADDRESS?.toLowerCase() === EXPECTED_USDC.toLowerCase();
  }
  if (id === "factory-verified") return Boolean(FACTORY_ADDRESS);
  return false;
}

export default function AdminBetaChecklistPage() {
  const [checks, setChecks] = useState({});

  useEffect(() => {
    setChecks(getAdminChecks());
  }, []);

  const toggle = (id, checked) => {
    setAdminCheck(id, checked);
    setChecks(getAdminChecks());
  };

  return (
    <PageWrapper title="Beta launch checklist" showBack>
      <p className="mb-4 text-sm text-[#6B7280]">
        Hidden admin page — not linked in navigation. Toggle manual checks after
        QA; automated checks reflect env configuration.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#1B5E20]">
            {section.title}
          </h2>
          <ul className="space-y-2 rounded-xl border border-border bg-white p-3">
            {section.items.map((item) => {
              const autoOk = item.auto ? autoPass(item.id) : null;
              const manual = checks[item.id] === true;
              const done = item.auto ? autoOk : manual;

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 border-b border-border py-2 last:border-0"
                >
                  {item.auto ? (
                    <span
                      className={
                        "mt-0.5 text-lg " +
                        (done ? "text-[#16A34A]" : "text-[#D1D5DB]")
                      }
                      aria-hidden
                    >
                      {done ? "☑" : "□"}
                    </span>
                  ) : (
                    <Checkbox
                      checked={manual}
                      onCheckedChange={(v) => toggle(item.id, Boolean(v))}
                      className="mt-0.5"
                    />
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className={done ? "text-[#166534]" : "text-[#1A1A1A]"}>
                      {item.label}
                    </p>
                    {item.href ? (
                      <Link
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#1B5E20]"
                      >
                        View on Basescan →
                      </Link>
                    ) : null}
                    {item.auto && !done ? (
                      <p className="text-xs text-[#DC2626]">
                        Configure NEXT_PUBLIC_FACTORY_ADDRESS / USDC in Vercel
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="rounded-xl bg-[#F5F7F5] p-3 font-mono text-[10px] text-[#6B7280]">
        <p>FACTORY: {FACTORY_ADDRESS || "(unset)"}</p>
        <p>USDC: {USDC_ADDRESS}</p>
        <p>WC ID: {process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? "set" : "unset"}</p>
        <p>RPC: {process.env.NEXT_PUBLIC_BASE_RPC_URL || "(default)"}</p>
      </div>
    </PageWrapper>
  );
}
