"use client";

import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "contribution", label: "Contributions" },
  { value: "payout", label: "Payouts Received" },
];

/**
 * @param {{ value: string, onChange: (v: string) => void }} props
 */
export function HistoryFilters({ value, onChange }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
      {FILTERS.map((f) => {
        const active = f.value === value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange?.(f.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-[#1B5E20] bg-[#1B5E20] text-white"
                : "border-border bg-white text-[#4B5563]",
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
