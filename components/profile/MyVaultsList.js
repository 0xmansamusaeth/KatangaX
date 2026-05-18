import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_BADGE = {
  active: "bg-[#16A34A]/15 text-[#166534]",
  completed: "bg-[#F3F4F6] text-[#4B5563]",
  paused: "bg-[#FFFBEB] text-[#92400E]",
};

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

/**
 * @param {{ vaults: any[] }} props
 */
export function MyVaultsList({ vaults }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">My Vaults</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1B5E20]/10 px-1.5 text-[10px] font-semibold text-[#1B5E20]">
          {vaults.length}
        </span>
      </div>
      {vaults.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-white p-4 text-center text-xs text-[#6B7280]">
          You haven’t joined any vaults yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {vaults.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1A1A1A]">
                  {v.name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  Round {v.currentRound} of {v.totalRounds}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  STATUS_BADGE[v.status] ?? STATUS_BADGE.active,
                )}
              >
                {STATUS_LABEL[v.status] ?? v.status}
              </span>
              <Link
                href={`/vaults/${v.id}`}
                className="shrink-0 text-sm font-medium text-[#1B5E20] hover:underline"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
