import { Button } from "@/components/ui/button";
import { cn, formatUSDC, formatDate } from "@/lib/utils";

/**
 * @param {{
 *   item: {
 *     id: string,
 *     vaultId: string,
 *     vaultName: string,
 *     memberCount: number,
 *     amount: number,
 *     dueDate: string,
 *     overdueDays: number,
 *     round: number,
 *   },
 *   onPay: () => void,
 * }} props
 */
export function PaymentDueCard({ item, onPay }) {
  const isOverdue = item.overdueDays > 0;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-white shadow-sm",
      )}
    >
      <div className="flex">
        <div
          className={cn(
            "w-1.5 shrink-0",
            isOverdue ? "bg-[#DC2626]" : "bg-[#16A34A]",
          )}
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#1A1A1A]">
                {item.vaultName}
              </p>
              <p className="text-xs text-[#6B7280]">
                {item.memberCount} members · Round {item.round}
              </p>
              <p
                className={cn(
                  "mt-1.5 text-xs font-medium",
                  isOverdue ? "text-[#DC2626]" : "text-[#4B5563]",
                )}
              >
                {isOverdue
                  ? `Overdue by ${item.overdueDays} day${item.overdueDays === 1 ? "" : "s"}`
                  : `Due ${formatDate(item.dueDate, { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>
            <p className="shrink-0 text-right text-lg font-bold text-[#1A1A1A]">
              {formatUSDC(item.amount)}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full rounded-xl"
            onClick={onPay}
          >
            Pay Now
          </Button>
        </div>
      </div>
    </article>
  );
}
