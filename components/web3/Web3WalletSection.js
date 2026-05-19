"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { useUSDCBalance } from "@/lib/web3/hooks/useUSDCBalance";
import { useWalletOnChainActivity } from "@/lib/web3/hooks/useWalletOnChainActivity";
import { toast } from "@/components/ui/toast";
import {
  basescanAddressUrl,
  basescanTxUrl,
  formatUsdc,
  truncateAddress,
} from "@/lib/web3/utils";
import { formatDate } from "@/lib/utils";
import { useDisconnect } from "wagmi";

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

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast("Address copied", { variant: "success" });
    } catch {
      toast("Could not copy", { variant: "error" });
    }
  };

  if (!isConnected) {
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
          <div className="mt-4">
            <ConnectWalletButton />
          </div>
        </div>
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

        <Link
          href={basescanAddressUrl(address) ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-semibold text-[#1B5E20]"
        >
          View on Basescan →
        </Link>

        <button
          type="button"
          onClick={() => disconnect()}
          className="mt-4 block text-sm font-medium text-[#DC2626]"
        >
          Disconnect
        </button>
      </div>

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
