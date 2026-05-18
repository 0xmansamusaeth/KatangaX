"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked = false,
  onCheckedChange,
  id,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-[#1B5E20] bg-[#1B5E20] text-white"
          : "border-[#D1D5DB] bg-white text-transparent",
        className,
      )}
      {...props}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </button>
  );
}
