"use client";

import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

const REDIRECT_KEY = "redirectAfterAuth";

const TITLES = {
  create_vault: "Create your free account to start a Vault",
  join_vault: "Sign in to join this Vault",
  accept_invite: "Sign in to accept this invitation",
  contribute: "Sign in to make your contribution",
  sign_disbursement: "Sign in to approve this payout",
  view_profile: "Sign in to see your profile",
  view_notifications: "Sign in to see your notifications",
  default: "Sign in to continue",
};

function saveRedirect(path) {
  if (typeof window === "undefined" || !path) return;
  try {
    window.sessionStorage.setItem(REDIRECT_KEY, path);
  } catch {
    /* ignore */
  }
}

export function AuthPromptModal({ open, action, onClose }) {
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();
  const title = TITLES[action] ?? TITLES.default;

  const goTo = (tab) => {
    saveRedirect(pathname);
    onClose?.();
    router.push(`/auth?tab=${tab}`);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Sign in to continue">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1B5E20]/10 text-[#1B5E20]">
          <Lock className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            KatangaX is free to use. Create an account in under a minute.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={() => goTo("signup")}
          >
            Create account
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => goTo("signin")}
          >
            Sign in
          </Button>
          <button
            type="button"
            className="text-xs font-medium text-[#6B7280] hover:underline"
            onClick={onClose}
          >
            Maybe later
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export { REDIRECT_KEY };
