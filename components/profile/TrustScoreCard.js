import { Star, StarHalf } from "lucide-react";

const BREAKDOWN = [
  { key: "onTime", label: "On-time payments", emoji: "✅" },
  { key: "missed", label: "Missed payments", emoji: "❌" },
  { key: "vaultsCompleted", label: "Vaults completed", emoji: "🏆" },
  { key: "membersReferred", label: "Members referred", emoji: "👥" },
];

/**
 * @param {{
 *   score: number,
 *   stats: { onTime: number, missed: number, vaultsCompleted: number, membersReferred: number },
 * }} props
 */
export function TrustScoreCard({ score, stats }) {
  const safe = Math.max(0, Math.min(5, Number(score) || 0));
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">Trust Score</p>
          <p className="text-[11px] text-[#6B7280]">
            Based on contribution history and completed vaults.
          </p>
        </div>
        <p className="text-2xl font-bold leading-none text-[#1A1A1A]">
          {safe.toFixed(1)}
          <span className="ml-1 text-sm font-medium text-[#6B7280]">/ 5</span>
        </p>
      </div>

      <div className="mt-3 flex items-center gap-1">
        <StarRow value={safe} />
      </div>

      <ul className="mt-4 space-y-2">
        {BREAKDOWN.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between rounded-lg bg-[#F5F7F5] px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2 text-[#1A1A1A]">
              <span aria-hidden>{row.emoji}</span>
              {row.label}
            </span>
            <span className="font-semibold text-[#1A1A1A]">
              {stats[row.key] ?? 0}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StarRow({ value }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      stars.push(
        <Star
          key={i}
          className="h-5 w-5 fill-[#FFC107] text-[#FFC107]"
          strokeWidth={1.5}
        />,
      );
    } else if (value >= i - 0.5) {
      stars.push(
        <StarHalf
          key={i}
          className="h-5 w-5 fill-[#FFC107] text-[#FFC107]"
          strokeWidth={1.5}
        />,
      );
    } else {
      stars.push(
        <Star
          key={i}
          className="h-5 w-5 text-[#E5E7EB]"
          strokeWidth={1.5}
        />,
      );
    }
  }
  return <>{stars}</>;
}
