import { Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * @param {{
 *   vaultsJoined: number,
 *   totalSaved: number,
 *   totalReceived: number,
 *   reliability: number,
 *   currency?: string,
 * }} props
 */
export function StatsGrid({
  vaultsJoined,
  totalSaved,
  totalReceived,
  reliability,
  currency = "ZMW",
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label="Vaults Joined" value={`${vaultsJoined}`} />
      <StatCard label="Total Saved" value={formatCurrency(totalSaved, currency)} accent />
      <StatCard
        label="Total Received"
        value={formatCurrency(totalReceived, currency)}
      />
      <StatCard
        label="Reliability Score"
        value={`${reliability}%`}
        trailing={
          <Star
            className="h-4 w-4 fill-[#FFC107] text-[#FFC107]"
            strokeWidth={1.5}
          />
        }
      />
    </div>
  );
}

function StatCard({ label, value, accent = false, trailing }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p
          className={
            "text-lg font-bold leading-tight " +
            (accent ? "text-[#1B5E20]" : "text-[#1A1A1A]")
          }
        >
          {value}
        </p>
        {trailing ?? null}
      </div>
    </div>
  );
}
