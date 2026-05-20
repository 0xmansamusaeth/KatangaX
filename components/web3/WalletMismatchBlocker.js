"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/hooks/useProfile";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { truncateAddress } from "@/lib/web3/utils";

const EXEMPT_PATHS = ["/onboarding", "/connect-wallet", "/auth/callback"];

function sameAddress(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * Full-screen, non-dismissible blocker shown whenever the wallet wired
 * into the user's profile differs from the one they have connected.
 * Suppressed on the onboarding / connect-wallet flows so users can fix
 * the mismatch.
 */
export function WalletMismatchBlocker() {
  const pathname = usePathname() ?? "";
  const { profile, updateProfile } = useProfile();
  const { address, isConnected } = useWalletConnection();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [confirmingUpdate, setConfirmingUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  const exempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!exempt && isConnected && profile?.walletAddress && address) {
      if (!sameAddress(profile.walletAddress, address)) {
        if (typeof document !== "undefined") {
          document.body.style.overflow = "hidden";
        }
        return () => {
          if (typeof document !== "undefined") {
            document.body.style.overflow = "";
          }
        };
      }
    }
    return undefined;
  }, [exempt, isConnected, profile?.walletAddress, address]);

  if (exempt) return null;
  if (!profile?.walletAddress || !isConnected || !address) return null;
  if (sameAddress(profile.walletAddress, address)) return null;

  const switchToProfileWallet = () => {
    try {
      disconnect();
    } catch {
      /* ignore */
    }
    setTimeout(() => openConnectModal?.(), 250);
  };

  const updateProfileToConnected = async () => {
    setUpdating(true);
    const res = await updateProfile({ walletAddress: address });
    setUpdating(false);
    if (res?.error) {
      toast(`Couldn't update profile: ${res.error}`, { variant: "error" });
    } else {
      toast("Profile wallet updated", { variant: "success" });
      setConfirmingUpdate(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1A1A1A]/85 px-5"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#DC2626]/30 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DC2626]/10">
          <ShieldAlert className="h-6 w-6 text-[#DC2626]" />
        </div>
        <h1 className="mt-3 text-lg font-bold text-[#1A1A1A]">
          ⚠️ Wallet Mismatch Detected
        </h1>
        <p className="mt-1 text-sm text-[#4B5563]">
          The connected wallet does not match your KatangaX profile. For your
          safety, all actions are blocked until you resolve this.
        </p>

        <dl className="mt-4 space-y-2 rounded-xl bg-[#F5F7F5] p-3 text-xs">
          <Row label="Profile wallet" value={truncateAddress(profile.walletAddress)} />
          <Row label="Connected wallet" value={truncateAddress(address)} highlight />
        </dl>

        {confirmingUpdate ? (
          <div className="mt-4 rounded-xl border border-[#FFC107]/40 bg-[#FFFBEB] p-3 text-xs text-[#4B5563]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#92400E]" />
              <div>
                <p className="font-semibold text-[#92400E]">
                  Updating your profile wallet
                </p>
                <p className="mt-1">
                  If you are a custodian in any vault, you must notify your
                  vault members and the vault organiser must update the
                  on-chain custodian address. This cannot be undone
                  automatically.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={updating}
                onClick={updateProfileToConnected}
              >
                {updating ? "Updating…" : "Yes, update my profile wallet"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setConfirmingUpdate(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={switchToProfileWallet}
            >
              Switch to profile wallet
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setConfirmingUpdate(true)}
            >
              Update profile to this wallet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd
        className={
          "font-mono text-[11px] " +
          (highlight ? "text-[#DC2626]" : "text-[#1A1A1A]")
        }
      >
        {value}
      </dd>
    </div>
  );
}
