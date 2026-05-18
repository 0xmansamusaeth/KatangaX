"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky tab bar with a sliding underline indicator.
 * Pinned to the top of its scroll context (sits below the fixed Header
 * thanks to PageWrapper's top padding).
 *
 * @param {{
 *   tabs: { value: string, label: string }[],
 *   value: string,
 *   onChange: (value: string) => void,
 *   className?: string,
 * }} props
 */
export function StickyTabs({ tabs, value, onChange, className }) {
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const refs = useRef({});

  useEffect(() => {
    const el = refs.current[value];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, tabs.length]);

  return (
    <div
      className={cn(
        "sticky z-30 -mx-4 border-b border-[#E5E7EB] bg-[#F5F7F5]/95 px-4 backdrop-blur",
        className,
      )}
      style={{ top: 0 }}
    >
      <div className="relative flex">
        {tabs.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[t.value] = el;
              }}
              type="button"
              onClick={() => onChange?.(t.value)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                active ? "text-[#1B5E20]" : "text-[#6B7280]",
              )}
            >
              {t.label}
            </button>
          );
        })}
        <span
          aria-hidden
          className="absolute bottom-0 h-[3px] rounded-full bg-[#1B5E20] transition-all duration-300"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>
    </div>
  );
}
