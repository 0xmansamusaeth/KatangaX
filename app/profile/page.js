"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MyVaultsList } from "@/components/profile/MyVaultsList";
import { PaymentMethodsCard } from "@/components/profile/PaymentMethodsCard";
import { Web3WalletSection } from "@/components/web3/Web3WalletSection";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { TrustScoreCard } from "@/components/profile/TrustScoreCard";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import { getProfileAggregates } from "@/lib/userActivity";
import { getTrustScore } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const { vaults } = useVaults();

  const myVaults = useMemo(
    () =>
      vaults.filter((v) =>
        (v.members ?? []).some((m) => m.userId === user.id),
      ),
    [vaults, user.id],
  );

  const aggregates = useMemo(
    () => getProfileAggregates(vaults, user),
    [vaults, user],
  );

  const trustScore = getTrustScore(user.id);

  const onLogout = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "katangax:session",
          JSON.stringify({ loggedOutAt: new Date().toISOString() }),
        );
      }
    } catch {
      /* ignore */
    }
    toast("Logged out on this device.", { variant: "info" });
    router.push("/dashboard");
  };

  return (
    <PageWrapper
      title="Profile"
      showSettings
      settingsHref="/profile/settings"
    >
      <div className="space-y-6">
        <ProfileHero user={user} />

        <StatsGrid
          vaultsJoined={aggregates.vaultsJoined}
          totalSaved={aggregates.totalContributed}
          totalReceived={aggregates.totalReceived}
          reliability={aggregates.reliability}
          currency={user.currency}
        />

        <TrustScoreCard
          score={trustScore}
          stats={{
            onTime: aggregates.onTime,
            missed: aggregates.missed,
            vaultsCompleted: aggregates.vaultsCompleted,
            membersReferred: 4,
          }}
        />

        <PaymentMethodsCard />

        <Web3WalletSection />

        <MyVaultsList vaults={myVaults} />

        <section className="border-t border-[#E5E7EB] pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Danger zone
          </h3>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full gap-2 border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/5"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </section>
      </div>
    </PageWrapper>
  );
}
