"use client";

import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visible indicator while pulling-to-refresh. Tracks the current pull
 * distance and switches to a spinner once refreshing.
 *
 * @param {{ pull: number, refreshing: boolean, threshold: number }} props
 */
export function PullIndicator({ pull, refreshing, threshold }) {
  const visible = pull > 4 || refreshing;
  const progress = Math.min(1, pull / threshold);
  const triggered = pull >= threshold || refreshing;

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center"
      style={{
        transform: `translateY(${Math.min(pull, threshold) - threshold}px)`,
        opacity: visible ? 1 : 0,
        transition: refreshing
          ? "transform 200ms ease-out, opacity 150ms ease-out"
          : pull === 0
          ? "transform 220ms ease-out, opacity 150ms ease-out"
          : "none",
      }}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md",
          triggered ? "text-[#1B5E20]" : "text-[#9CA3AF]",
        )}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
        ) : (
          <ArrowDown
            className="h-5 w-5 transition-transform"
            strokeWidth={2}
            style={{
              transform: `rotate(${triggered ? 180 : progress * 180}deg)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
