"use client";

import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  NOTIFICATION_TYPES,
  getNotificationMeta,
} from "@/lib/notificationTemplates";

const INVITE_TYPES = new Set([
  NOTIFICATION_TYPES.VAULT_INVITE,
  "invitation",
]);

/**
 * @param {{
 *   notification: any,
 *   onTap?: () => void,
 *   onAccept?: () => void,
 *   onDecline?: () => void,
 * }} props
 */
export function NotificationItem({
  notification,
  onTap,
  onAccept,
  onDecline,
}) {
  const meta = getNotificationMeta(notification.type);
  const Icon = meta.Icon;
  const isInvite = INVITE_TYPES.has(notification.type);
  const unread = !notification.read;
  const bodyText = notification.body ?? notification.message ?? "";

  return (
    <div
      className={cn(
        "rounded-2xl shadow-sm transition-colors",
        unread
          ? "border-l-2 border-[#1B5E20] bg-white"
          : "border-l-2 border-transparent bg-[#F1F3F4]",
      )}
    >
      <button
        type="button"
        onClick={onTap}
        className="flex w-full items-start gap-3 rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            meta.wrap,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#1A1A1A]">
              {notification.title}
            </p>
            {unread ? (
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#FFC107]"
              />
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-[#6B7280]">
            {bodyText}
          </p>
          <p
            className="mt-1 text-[11px] text-[#9CA3AF]"
            suppressHydrationWarning
          >
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </button>

      {isInvite ? (
        <div className="flex gap-2 px-4 pb-3">
          <Button
            type="button"
            size="sm"
            className="flex-1 rounded-full"
            onClick={onAccept}
          >
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 rounded-full border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/5"
            onClick={onDecline}
          >
            Decline
          </Button>
        </div>
      ) : null}
    </div>
  );
}
