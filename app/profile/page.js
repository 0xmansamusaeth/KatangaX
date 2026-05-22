"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MyVaultsList } from "@/components/profile/MyVaultsList";
import { PaymentMethodsCard } from "@/components/profile/PaymentMethodsCard";
import { Web3WalletSection } from "@/components/web3/Web3WalletSection";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { TrustScoreCard } from "@/components/profile/TrustScoreCard";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import { useProfileStats } from "@/hooks/useProfileStats";
import { getTrustScore } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const { vaults } = useVaults();
  const stats = useProfileStats();

  const myVaults = useMemo(
    () =>
      vaults.filter((v) =>
        (v.members ?? []).some((m) => m.userId === user.id),
      ),
    [vaults, user.id],
  );

  const trustScore = getTrustScore(user.id);

  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast("Signed out", { variant: "info" });
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
          vaultsJoined={stats.vaultsJoined}
          totalSaved={stats.totalContributed}
          totalReceived={stats.totalReceived}
          reliability={stats.reliability}
          currency="USDC"
        />

        {stats.custodianOf > 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-[#FFC107]/40 bg-[#FFFBEB] p-3 text-sm">
            <ShieldCheck className="h-5 w-5 text-[#92400E]" />
            <span className="text-[#92400E]">
              Custodian on{" "}
              <span className="font-semibold">{stats.custodianOf}</span> vault
              {stats.custodianOf === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        <TrustScoreCard
          score={trustScore}
          stats={{
            onTime: stats.onTime,
            missed: stats.missed,
            vaultsCompleted: stats.vaultsCompleted,
            membersReferred: 0,
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
