"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { VaultCard } from "@/components/vaults/VaultCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useMounted } from "@/hooks/useMounted";
import { useVaults } from "@/hooks/useVaults";
import { useProfile } from "@/hooks/useProfile";
import { canCreateVault } from "@/lib/vaultGuards";

export default function VaultsPage() {
  const { vaults } = useVaults();
  const { profile } = useProfile();
  const mounted = useMounted();

  const activeVaultCount = useMemo(
    () =>
      vaults.filter(
        (v) =>
          v.organiserId === profile?.id &&
          (v.status === "active" || v.status === "pending"),
      ).length,
    [vaults, profile?.id],
  );

  const createGuard = canCreateVault(profile, { activeVaultCount });

  return (
    <PageWrapper title="Vaults">
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/vaults/registry">Registry</Link>
        </Button>
        {createGuard.allowed ? (
          <Button variant="accent" size="sm" asChild>
            <Link href="/vaults/new" className="gap-1">
              <Plus className="h-4 w-4" />
              Create
            </Link>
          </Button>
        ) : (
          <Button
            variant="accent"
            size="sm"
            type="button"
            title={createGuard.reason}
            onClick={() =>
              toast(createGuard.reason ?? "Cannot create vault", {
                variant: "error",
              })
            }
            className="gap-1 opacity-60"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        )}
      </div>

      {!mounted ? (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[112px] w-full rounded-2xl" />
          ))}
        </div>
      ) : vaults.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Start your first Vault"
          description="Create a savings circle with people you trust and KatangaX will handle the rotation."
          actionLabel="Create a Vault"
          actionHref="/vaults/new"
        />
      ) : (
        <div className="space-y-3">
          {vaults.map((v) => (
            <VaultCard key={v.id} vault={v} />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
