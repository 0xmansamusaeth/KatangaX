import { Landmark, PiggyBank, Star, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * @param {{
 *   vaultsJoined: number,
 *   totalSaved: number,
 *   totalReceived: number,
 *   reliabilityPct: number,
 *   currency?: string,
 * }} props
 */
export function ProfileStats({
  vaultsJoined,
  totalSaved,
  totalReceived,
  reliabilityPct,
  currency = "ZMW",
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Vaults Joined"
        value={String(vaultsJoined)}
        Icon={Landmark}
        iconColor="text-[#1B5E20]"
        iconBg="bg-[#1B5E20]/10"
      />
      <StatCard
        label="Total Saved"
        value={formatCurrency(totalSaved, currency)}
        Icon={PiggyBank}
        iconColor="text-[#16A34A]"
        iconBg="bg-[#16A34A]/10"
      />
      <StatCard
        label="Total Received"
        value={formatCurrency(totalReceived, currency)}
        Icon={TrendingDown}
        iconColor="text-[#92400E]"
        iconBg="bg-[#FFC107]/25"
      />
      <StatCard
        label="Reliability"
        value={`${Math.round(reliabilityPct)}%`}
        Icon={Star}
        iconColor="text-[#FFC107]"
        iconBg="bg-[#FFC107]/20"
        iconFill="fill-[#FFC107]"
      />
    </div>
  );
}

function StatCard({ label, value, Icon, iconColor, iconBg, iconFill }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">
          {label}
        </p>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${iconBg}`}
        >
          <Icon
            className={`h-3.5 w-3.5 ${iconColor} ${iconFill ?? ""}`}
            strokeWidth={2}
          />
        </span>
      </div>
      <p className="mt-2 text-lg font-bold leading-tight text-[#1A1A1A]">
        {value}
      </p>
    </div>
  );
}
