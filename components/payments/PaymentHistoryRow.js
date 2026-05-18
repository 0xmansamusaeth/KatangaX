import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANTS = {
  paid: "bg-[#16A34A]/15 text-[#166534]",
  pending: "bg-[#FFC107]/20 text-[#92400E]",
  late: "bg-[#DC2626]/15 text-[#991B1B]",
  received: "bg-[#FFC107]/20 text-[#92400E]",
};

const STATUS_LABELS = {
  paid: "Paid",
  pending: "Pending",
  late: "Late",
  received: "Received",
};

/**
 * @param {{
 *   item: {
 *     id: string,
 *     kind: "contribution" | "payout",
 *     vaultName: string,
 *     round: number,
 *     totalRounds: number,
 *     amount: number,
 *     date: string,
 *     status: "paid"|"pending"|"late"|"received",
 *   },
 * }} props
 */
export function PaymentHistoryRow({ item }) {
  const isPayout = item.kind === "payout";
  const Icon = isPayout ? ArrowDownLeft : ArrowUpRight;
  const iconWrap = isPayout
    ? "bg-[#FFC107]/20 text-[#92400E]"
    : "bg-[#16A34A]/15 text-[#166534]";
  const amountClass = isPayout
    ? "text-[#1B5E20]"
    : "text-[#4B5563]";

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          iconWrap,
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#1A1A1A]">
          {item.vaultName}
        </p>
        <p className="text-xs text-[#6B7280]">
          {isPayout ? "Payout · " : "Contribution · "}
          Round {item.round}
          {item.totalRounds ? ` of ${item.totalRounds}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className={cn("text-sm font-bold", amountClass)}>
          {isPayout ? "+" : "−"}
          {formatCurrency(item.amount)}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              STATUS_VARIANTS[item.status] ?? STATUS_VARIANTS.paid,
            )}
          >
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
          <span className="text-[10px] text-[#9CA3AF]">
            {formatDate(item.date, { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
    </li>
  );
}
