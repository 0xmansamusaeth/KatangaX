"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFactoryVaults } from "@/lib/web3/hooks/useFactoryVaults";
import {
  basescanAddressUrl,
  truncateAddress,
} from "@/lib/web3/utils";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function VaultRegistryPage() {
  const { vaults, isLoading, isConfigured } = useFactoryVaults();
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let list = [...vaults];
    if (activeOnly) list = list.filter((v) => v.isActive);
    if (sort === "members") {
      list.sort((a, b) => b.memberCount - a.memberCount);
    } else if (sort === "amount") {
      list.sort((a, b) =>
        Number(b.contributionAmount - a.contributionAmount),
      );
    } else {
      list.reverse();
    }
    return list;
  }, [vaults, activeOnly, sort]);

  const shown = filtered.slice(0, visible);

  return (
    <PageWrapper title="Registry" showBack>
      <header className="space-y-1 pb-4">
        <h2 className="text-lg font-bold text-[#1A1A1A]">
          Public Vault Registry
        </h2>
        <p className="text-sm text-[#6B7280]">All vaults on Base mainnet</p>
      </header>

      {!isConfigured ? (
        <p className="text-sm text-[#6B7280]">
          Set NEXT_PUBLIC_FACTORY_ADDRESS to load the registry.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveOnly((v) => !v)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                activeOnly
                  ? "border-[#1B5E20] bg-[#1B5E20] text-white"
                  : "border-border bg-white text-[#4B5563]",
              )}
            >
              Active only
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-[#4B5563]"
            >
              <option value="newest">Newest</option>
              <option value="members">Most Members</option>
              <option value="amount">Highest Amount</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-hidden>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
              <p className="text-sm font-semibold text-[#1A1A1A]">
                No vaults deployed yet
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {shown.map((v) => (
                  <li
                    key={v.address}
                    className="rounded-2xl border border-border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#1A1A1A]">
                          {v.vaultName}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#6B7280]">
                          {truncateAddress(v.organiser)} · organiser
                        </p>
                      </div>
                      <a
                        href={basescanAddressUrl(v.address) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[#0052FF]"
                        aria-label="View contract"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <p className="text-[#6B7280]">
                        Members:{" "}
                        <span className="font-semibold text-[#1A1A1A]">
                          {v.memberCount}
                        </span>
                      </p>
                      <p className="text-[#6B7280]">
                        Per round:{" "}
                        <span className="font-semibold text-[#1B5E20]">
                          {v.contributionFormatted}
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          v.isActive
                            ? "bg-[#16A34A]/15 text-[#166534]"
                            : "bg-[#F3F4F6] text-[#4B5563]",
                        )}
                      >
                        {v.isActive ? "Active" : "Completed"}
                      </span>
                      <span className="text-[11px] font-medium text-[#6B7280]">
                        Round {v.currentRound} of {v.totalRounds}
                      </span>
                    </div>

                    <Button className="mt-3 w-full rounded-xl" size="sm" asChild>
                      <Link href={`/vaults/${v.address}`}>View Details</Link>
                    </Button>
                  </li>
                ))}
              </ul>

              {visible < filtered.length ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setVisible((n) => n + PAGE_SIZE)}
                >
                  Load more
                </Button>
              ) : null}
            </>
          )}
        </>
      )}
    </PageWrapper>
  );
}
