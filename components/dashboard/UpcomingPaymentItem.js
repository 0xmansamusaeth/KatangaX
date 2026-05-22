"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useMounted } from "@/hooks/useMounted";
import { formatUSDC, formatDate, isDueDateOverdue } from "@/lib/utils";

export function UpcomingPaymentItem({ payment, vaultColor }) {
  // `isDueDateOverdue` uses `new Date()`, so the resulting className/Badge
  // would differ between SSR (UTC) and the client (local TZ). Defer to mount.
  const mounted = useMounted();
  const overdue =
    mounted && payment.status !== "paid" && isDueDateOverdue(payment.dueDate);

  return (
    <div
      className={`rounded-xl bg-white p-4 shadow-sm ${
        overdue ? "border-l-4 border-[#DC2626]" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: vaultColor ?? "#1B5E20" }}
        >
          {payment.vaultName?.charAt(0) ?? "V"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-[#1A1A1A]">
              {payment.vaultName}
            </p>
            {overdue ? (
              <Badge variant="destructive" className="text-[10px]">
                Overdue
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-[#6B7280]">
            Due{" "}
            {formatDate(payment.dueDate, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="text-sm font-bold text-[#1A1A1A]">
            {formatUSDC(payment.amount)}
          </p>
          <Link
            href="/payments"
            className="rounded-full bg-[#1B5E20] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#145214]"
          >
            Pay
          </Link>
        </div>
      </div>
    </div>
  );
}
