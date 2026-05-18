"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function FloatingNewVaultButton() {
  return (
    <Link
      href="/vaults/new"
      aria-label="Create new vault"
      className="animate-fab-mount fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B5E20] text-white shadow-lg shadow-[#1B5E20]/30 transition-transform hover:scale-105 active:scale-95"
      style={{
        bottom:
          "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)",
        right: "max(1rem, calc((100vw - 430px) / 2 + 1rem))",
      }}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}
