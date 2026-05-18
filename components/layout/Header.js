"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export function Header({
  title,
  showBack = false,
  showNotification = false,
  showSettings = false,
  settingsHref = "/profile",
}) {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <header className="fixed left-1/2 top-0 z-40 w-full max-w-[430px] -translate-x-1/2 border-b border-[#E5E7EB] bg-white">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="relative flex h-14 items-center justify-center px-3">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full text-[#1A1A1A] transition-colors hover:bg-[#F5F7F5]"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : null}

          <h1 className="max-w-[70%] truncate px-10 text-center text-lg font-semibold text-[#1A1A1A]">
            {title}
          </h1>

          <div className="absolute right-2 flex items-center gap-0.5">
            {showNotification ? (
              <Link
                href="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#1A1A1A] transition-colors hover:bg-[#F5F7F5]"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell className="h-5 w-5" strokeWidth={1.75} />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {showSettings ? (
              <Link
                href={settingsHref}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#1A1A1A] transition-colors hover:bg-[#F5F7F5]"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" strokeWidth={1.75} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
