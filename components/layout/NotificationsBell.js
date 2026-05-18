"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationsBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link href="/notifications" aria-label="Notifications">
      <Button type="button" variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
        ) : null}
      </Button>
    </Link>
  );
}
