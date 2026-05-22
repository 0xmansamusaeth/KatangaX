"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ArrowRight, Lock, Coins, PartyPopper, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useFactoryVaults } from "@/lib/web3/hooks/useFactoryVaults";
import { truncateAddress } from "@/lib/web3/utils";

const STEPS = [
  {
    icon: Lock,
    title: "Create a Vault",
    body: "Set the rules, invite your people, assign custodians.",
  },
  {
    icon: Coins,
    title: "Contribute Each Round",
    body: "Everyone pays in with USDC on Base. No banks needed.",
  },
  {
    icon: PartyPopper,
    title: "Get Paid Out",
    body: "Each member receives the full pot once per cycle.",
  },
];

export function GuestDashboard() {
  const router = useRouter();
  const { requireAuth } = useAuthGuard();
  const howRef = useRef(null);
  const { vaults, isLoading, isConfigured } = useFactoryVaults();

  const preview = (vaults ?? []).slice(0, 3);

  return (
    <main
      className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[#F5F7F5]"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <header className="mx-auto flex w-full max-w-[430px] items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B5E20] text-sm font-bold text-white">
            KX
          </div>
          <span className="text-base font-semibold text-[#1A1A1A]">KatangaX</span>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20]/5"
        >
          <Link href="/auth?tab=signin">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-[430px] px-4">
        <div
          className="overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-[#1B5E20]/20"
          style={{
            background:
              "linear-gradient(135deg, #1B5E20 0%, #2E7D32 55%, #43A047 100%)",
          }}
        >
          <h1 className="text-2xl font-bold leading-tight">
            Save together.
            <br />
            Grow together.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/90">
            Join a Vault with friends and family. Contribute USDC on Base, get paid
            out in turns.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Button
              type="button"
              className="bg-white text-[#1B5E20] hover:bg-white/90"
              size="lg"
              onClick={() =>
                requireAuth("create_vault", () => router.push("/vaults/new"))
              }
            >
              Create a Vault
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="border-white/80 bg-transparent text-white hover:bg-white/10"
              onClick={() =>
                howRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Learn how it works
            </Button>
          </div>
        </div>
      </section>

      <section
        ref={howRef}
        className="mx-auto mt-10 w-full max-w-[430px] px-4"
      >
        <h2 className="text-base font-semibold text-[#1A1A1A]">How it works</h2>
        <ol className="mt-3 space-y-3">
          {STEPS.map(({ icon: Icon, title, body }, idx) => (
            <li
              key={title}
              className="flex gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B5E20]/10 text-[#1B5E20]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {idx + 1}. {title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-10 w-full max-w-[430px] px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            Active Vaults on KatangaX
          </h2>
          <Link
            href="/vaults/registry"
            className="text-sm font-medium text-[#1B5E20] hover:underline"
          >
            Browse all
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {!isConfigured ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-5 text-center">
              <p className="text-sm text-[#6B7280]">
                Public registry is not configured yet.
              </p>
            </div>
          ) : isLoading ? (
            <>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </>
          ) : preview.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-5 text-center">
              <p className="text-sm font-medium text-[#1A1A1A]">
                No vaults yet
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Be the first to start one.
              </p>
            </div>
          ) : (
            preview.map((v) => (
              <div
                key={v.address}
                className="rounded-2xl border border-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                      {v.vaultName}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#6B7280]">
                      {truncateAddress(v.organiser ?? v.address)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#1B5E20]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1B5E20]">
                    Round {v.currentRound}
                  </span>
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
                <Button asChild size="sm" className="mt-3 w-full rounded-xl">
                  <Link href={`/vaults/${v.address}`}>
                    View
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-[430px] px-4">
        <div className="rounded-2xl border border-border bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Ready to join the rotation?
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Create your free account in under a minute.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href="/auth?tab=signup">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/auth?tab=signin">I already have one</Link>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-[#9CA3AF]">
          KatangaX runs on Base · USDC stablecoin
          <span className="mx-1">·</span>
          <a
            href="https://basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-[#6B7280]"
          >
            Basescan <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </section>
    </main>
  );
}
