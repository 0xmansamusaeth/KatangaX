"use client";

import Link from "next/link";
import { getAppUrl, getMobileWalletLinks } from "@/lib/web3/deepLinks";

export function MobileWalletLinks() {
  const links = getMobileWalletLinks(getAppUrl());

  return (
    <div className="space-y-2 rounded-xl border border-border bg-[#F5F7F5] p-3">
      <p className="text-xs font-medium text-[#6B7280]">
        No wallet detected. Open KatangaX in your mobile wallet app:
      </p>
      {links.map((l) => (
        <Link
          key={l.id}
          href={l.href}
          className="block rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-[#1B5E20] shadow-sm"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
