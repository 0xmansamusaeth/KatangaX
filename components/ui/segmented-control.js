"use client";

import { cn } from "@/lib/utils";

/**
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   options: { value: string, label: string }[],
 *   className?: string,
 * }} props
 */
export function SegmentedControl({ value, onChange, options, className }) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "flex w-full rounded-xl bg-[#F3F4F6] p-1 text-sm",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              "flex-1 rounded-lg px-2 py-2 font-medium transition-colors",
              active
                ? "bg-[#1B5E20] text-white shadow-sm"
                : "text-[#4B5563] hover:text-[#1A1A1A]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
