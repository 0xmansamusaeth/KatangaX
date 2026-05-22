import { formatUSDC } from "@/lib/utils";

export function ContributionHistory({ history }) {
  if (!history?.length) {
    return (
      <p className="text-sm text-[#6B7280]">No contribution history yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {history.map((h) => (
        <li
          key={h.round}
          className="rounded-xl border border-border bg-white p-3 text-sm"
        >
          <p className="font-medium text-[#1A1A1A]">Round {h.round}</p>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            Collected {formatUSDC(h.totalCollected)} · Expected{" "}
            {formatUSDC(h.expectedTotal)}
          </p>
        </li>
      ))}
    </ul>
  );
}
