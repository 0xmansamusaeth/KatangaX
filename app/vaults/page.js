"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { VaultCard } from "@/components/vaults/VaultCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMounted } from "@/hooks/useMounted";
import { useVaults } from "@/hooks/useVaults";
import { useProfile } from "@/hooks/useProfile";
import { canCreateVault } from "@/lib/vaultGuards";

export default function VaultsPage() {
  const router = useRouter();
  const { vaults } = useVaults();
  const { profile } = useProfile();
  const { isAuthenticated, requireAuth } = useAuthGuard();
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

  const startCreate = () => {
    if (!isAuthenticated) {
      requireAuth("create_vault");
      return;
    }
    if (!createGuard.allowed) {
      toast(createGuard.reason ?? "Cannot create vault", { variant: "error" });
      return;
    }
    router.push("/vaults/new");
  };

  return (
    <PageWrapper title="Vaults">
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/vaults/registry">Registry</Link>
        </Button>
        <Button
          variant="accent"
          size="sm"
          type="button"
          onClick={startCreate}
          title={
            isAuthenticated && !createGuard.allowed
              ? createGuard.reason
              : undefined
          }
          className={
            "gap-1 " +
            (isAuthenticated && !createGuard.allowed ? "opacity-60" : "")
          }
        >
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      {!isAuthenticated ? (
        <div className="space-y-4">
          <EmptyState
            icon={Wallet}
            title="Browse the public registry"
            description="Sign in to create or join a vault. Anyone can view active vaults on Base."
            actionLabel="Open Registry"
            actionHref="/vaults/registry"
          />
        </div>
      ) : !mounted ? (
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
