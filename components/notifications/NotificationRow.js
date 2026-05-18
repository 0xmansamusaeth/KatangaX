"use client";

import {
  AlertTriangle,
  Clock,
  Gift,
  Landmark,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";

const TYPE_META = {
  payment_reminder: {
    Icon: Clock,
    bg: "bg-[#16A34A]/15",
    color: "text-[#1B5E20]",
  },
  payout_alert: {
    Icon: Gift,
    bg: "bg-[#FFC107]/25",
    color: "text-[#92400E]",
  },
  member_join: {
    Icon: UserPlus,
    bg: "bg-[#1E40AF]/15",
    color: "text-[#1E40AF]",
  },
  late_payment: {
    Icon: AlertTriangle,
    bg: "bg-[#DC2626]/15",
    color: "text-[#DC2626]",
  },
  invitation: {
    Icon: Landmark,
    bg: "bg-[#E5E7EB]",
    color: "text-[#4B5563]",
  },
};

/**
 * @param {{
 *   notification: any,
 *   onClick?: () => void,
 *   onAccept?: () => void,
 *   onDecline?: () => void,
 * }} props
 */
export function NotificationRow({
  notification,
  onClick,
  onAccept,
  onDecline,
}) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.invitation;
  const Icon = meta.Icon;
  const isInvite = notification.type === "invitation";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "w-full rounded-xl p-4 text-left transition-colors",
        notification.read
          ? "bg-[#F3F4F6]"
          : "border-l-2 border-[#1B5E20] bg-white shadow-sm",
        onClick ? "cursor-pointer hover:bg-white" : "",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            meta.bg,
          )}
        >
          <Icon className={cn("h-5 w-5", meta.color)} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {notification.title}
            </p>
            {!notification.read ? (
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1B5E20]"
              />
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">
            {notification.body}
          </p>
          <p
            className="mt-1.5 text-[11px] font-medium text-[#9CA3AF]"
            suppressHydrationWarning
          >
            {formatRelativeTime(notification.createdAt)}
          </p>

          {isInvite && (onAccept || onDecline) ? (
            <div className="mt-3 flex gap-2">
              {onAccept ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept();
                  }}
                >
                  Accept
                </Button>
              ) : null}
              {onDecline ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecline();
                  }}
                >
                  Decline
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
