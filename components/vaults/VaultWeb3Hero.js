"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { useOnChainVaultData } from "@/lib/web3/hooks/useOnChainVaultData";
import {
  basescanAddressUrl,
  truncateAddress,
  usdcToZmwEstimate,
} from "@/lib/web3/utils";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

/**
 * @param {{ vault: { contractAddress?: string, contributionAmount?: number } }} props
 */
export function VaultWeb3Hero({ vault }) {
  const chain = useVaultContract(vault.contractAddress);

  if (!vault.contractAddress) return null;

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(vault.contractAddress);
      toast("Contract address copied", { variant: "success" });
    } catch {
      toast("Could not copy", { variant: "error" });
    }
  };

  const zmwEst = usdcToZmwEstimate(
    Number(vault.contributionAmount ?? 0) * (chain.memberCount || 1),
  );

  return (
    <div className="mt-3 flex w-full flex-col items-center gap-2">
      <button
        type="button"
        onClick={copyContract}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-mono text-[11px] font-medium text-[#1A1A1A] shadow-sm"
      >
        {truncateAddress(vault.contractAddress)}
        <Copy className="h-3 w-3 text-[#6B7280]" />
        <Link
          href={basescanAddressUrl(vault.contractAddress) ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#0052FF]"
          aria-label="View contract on Basescan"
        >
          <ExternalLink className="h-3 w-3" />
        </Link>
      </button>

      {chain.isStale ? (
        <p className="text-[10px] font-medium text-[#D97706]">
          Live data may be outdated — pull to refresh in Overview
        </p>
      ) : null}

      {chain.usdcBalance > 0n ? (
        <p className="text-[11px] text-[#6B7280]">
          Vault holds {chain.usdcBalanceFormatted}
          {zmwEst > 0 ? (
            <span> · ~{formatCurrency(zmwEst)} equivalent</span>
          ) : null}
        </p>
      ) : null}

      <span className="inline-flex items-center gap-1 rounded-full bg-[#0052FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0052FF]">
        Powered by Base
      </span>
    </div>
  );
}
