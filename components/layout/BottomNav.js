"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, House, Landmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/vaults", label: "Vaults", Icon: Landmark },
  { href: "/payments", label: "Payments", Icon: CreditCard },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/connect-wallet"
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[#E5E7EB] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      aria-label="Primary navigation"
    >
      <div
        className="flex min-h-16 w-full items-stretch px-1"
        style={{
          paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition duration-150 ease-out active:scale-95",
                isActive ? "text-[#1B5E20]" : "text-[#9CA3AF]",
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "h-[22px] w-[22px] transition-transform",
                  isActive ? "scale-110" : "scale-100",
                )}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
