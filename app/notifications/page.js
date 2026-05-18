"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/useMounted";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotificationGroup } from "@/lib/utils";

const GROUP_ORDER = ["today", "week", "earlier"];
const GROUP_LABELS = {
  today: "Today",
  week: "This Week",
  earlier: "Earlier",
};

export default function NotificationsPage() {
  const router = useRouter();
  const mounted = useMounted();
  const {
    notifications,
    markRead,
    markAllRead,
    removeNotification,
    acceptInvite,
  } = useNotifications();

  const sortedNotifications = useMemo(
    () =>
      notifications
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications],
  );

  // Group buckets depend on `new Date()` (today/this week/earlier), so we
  // only switch to the grouped layout after hydration. Server + first
  // client paint show a single flat list, which is structurally stable.
  const grouped = useMemo(() => {
    /** @type {Record<string, any[]>} */
    const groups = { today: [], week: [], earlier: [] };
    for (const n of sortedNotifications) {
      const g = getNotificationGroup(n.createdAt);
      groups[g].push(n);
    }
    return groups;
  }, [sortedNotifications]);

  const onTap = (n) => {
    if (!n.read) markRead(n.id);
    if (n.vaultId) router.push(`/vaults/${n.vaultId}`);
  };

  const onAccept = (n) => {
    acceptInvite(n.id);
    toast("Invitation accepted. Vault added to your list.");
  };

  const onDecline = (n) => {
    removeNotification(n.id);
    toast("Invitation declined.", { variant: "info" });
  };

  const empty = notifications.length === 0;
  const allRead = notifications.every((n) => n.read);

  return (
    <PageWrapper
      title="Notifications"
      showBack
      showSettings={false}
    >
      {!empty ? (
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            onClick={markAllRead}
            disabled={allRead}
            className="text-sm font-medium text-[#1B5E20] transition-colors hover:underline disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:no-underline"
          >
            Mark all read
          </button>
        </div>
      ) : null}

      {!mounted ? (
        <ul className="space-y-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <Skeleton className="h-[72px] w-full rounded-2xl" />
            </li>
          ))}
        </ul>
      ) : empty ? (
        <EmptyState
          icon={Bell}
          title="Nothing here yet"
          description="Reminders, payout alerts and invitations will show up here."
        />
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map((g) => {
            const items = grouped[g];
            if (!items.length) return null;
            return (
              <section key={g} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  {GROUP_LABELS[g]}
                </h2>
                <ul className="space-y-2">
                  {items.map((n) => (
                    <li key={n.id}>
                      <NotificationItem
                        notification={n}
                        onTap={() => onTap(n)}
                        onAccept={() => onAccept(n)}
                        onDecline={() => onDecline(n)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
