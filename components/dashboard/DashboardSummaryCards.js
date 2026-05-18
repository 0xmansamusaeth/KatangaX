import { Landmark, PiggyBank, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function DashboardSummaryCards({
  totalSaved,
  nextPayoutAmount,
  nextPayoutVaultName,
  activeVaultCount,
  currency = "ZMW",
}) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
      <div className="min-w-[140px] shrink-0 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-[#6B7280]">Total Saved</p>
        <div className="mt-2 flex items-start justify-between gap-2">
          <p className="text-lg font-semibold leading-tight text-[#1A1A1A]">
            {formatCurrency(totalSaved, currency)}
          </p>
          <PiggyBank
            className="h-6 w-6 shrink-0 text-[#1B5E20]"
            strokeWidth={1.75}
          />
        </div>
      </div>

      <div className="min-w-[140px] shrink-0 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-[#6B7280]">Next Payout</p>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight text-[#1A1A1A]">
              {formatCurrency(nextPayoutAmount, currency)}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">
              {nextPayoutVaultName}
            </p>
          </div>
          <TrendingUp
            className="h-6 w-6 shrink-0 text-[#FFC107]"
            strokeWidth={1.75}
          />
        </div>
      </div>

      <div className="min-w-[140px] shrink-0 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-[#6B7280]">Active Vaults</p>
        <div className="mt-2 flex items-start justify-between gap-2">
          <p className="text-lg font-semibold leading-tight text-[#1A1A1A]">
            {activeVaultCount}
          </p>
          <Landmark
            className="h-6 w-6 shrink-0 text-[#1B5E20]"
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  );
}
