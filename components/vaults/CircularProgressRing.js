"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SVG circular progress ring. Animates from 0 → target value on mount
 * (and whenever `value` changes) using a CSS transition on
 * `stroke-dashoffset`.
 *
 * @param {{
 *   value: number,
 *   size?: number,
 *   stroke?: number,
 *   trackColor?: string,
 *   ringColor?: string,
 *   className?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export function CircularProgressRing({
  value = 0,
  size = 176,
  stroke = 12,
  trackColor = "#E5E7EB",
  ringColor = "#1B5E20",
  className,
  children,
}) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  // Start at 0 so server + first client paint produce an empty ring,
  // then animate to the target after mount.
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShown(v));
    return () => window.cancelAnimationFrame(id);
  }, [v]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (shown / 100) * c;
  const cx = size / 2;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
