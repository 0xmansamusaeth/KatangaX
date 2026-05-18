import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const statusClass = {
  active:
    "border border-[#16A34A]/25 bg-[#16A34A]/12 text-[#166534]",
  completed: "border border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]",
  pending:
    "border border-[#FFC107]/40 bg-[#FFFBEB] text-[#B45309]",
  paused:
    "border border-[#E5E7EB] bg-[#FFFBEB] text-[#B45309]",
};

function statusLabel(status) {
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  return status;
}

export function DashboardVaultCard({ vault, nextDueDate }) {
  const pct =
    vault.totalRounds > 0
      ? Math.round((vault.currentRound / vault.totalRounds) * 100)
      : 0;

  const members = vault.members ?? [];
  const shown = members.slice(0, 4);
  const more = Math.max(0, members.length - 4);

  return (
    <Link
      href={`/vaults/${vault.id}`}
      className="block w-[260px] shrink-0 rounded-2xl bg-white p-4 shadow-sm transition duration-150 ease-out hover:shadow-md active:scale-[0.98] active:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate font-semibold text-[#1A1A1A]">
          {vault.name}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass[vault.status] ?? statusClass.pending}`}
        >
          {statusLabel(vault.status)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex -space-x-2">
          {shown.map((m) => (
            <div
              key={m.id}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
              style={{ backgroundColor: m.avatarColor }}
            >
              {m.initials}
            </div>
          ))}
        </div>
        {more > 0 ? (
          <span className="text-xs font-medium text-[#6B7280]">+{more} more</span>
        ) : (
          <span className="text-xs text-transparent">.</span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-[#6B7280]">
          <span>
            Round {vault.currentRound} of {vault.totalRounds}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#1B5E20] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#F3F4F6] pt-3">
        <p className="text-sm font-semibold text-[#1A1A1A]">
          Next: {formatCurrency(vault.contributionAmount, "ZMW")}
        </p>
        {nextDueDate ? (
          <span className="rounded-full bg-[#F5F7F5] px-2.5 py-1 text-[10px] font-medium text-[#4B5563]">
            Due {nextDueDate}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
