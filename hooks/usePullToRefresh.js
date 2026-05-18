"use client";

import { useEffect, useState } from "react";

/**
 * Touch-driven pull-to-refresh. Triggers `onRefresh` when the user
 * pulls past `threshold` while the page is scrolled to the very top.
 *
 * @param {{
 *   onRefresh: () => void | Promise<void>,
 *   threshold?: number,
 *   maxPull?: number,
 *   enabled?: boolean,
 * }} opts
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 64,
  maxPull = 96,
  enabled = true,
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let startY = null;
    let currentPull = 0;
    let busy = false;

    const onTouchStart = (e) => {
      if (busy) return;
      if (window.scrollY > 0) {
        startY = null;
        return;
      }
      startY = e.touches?.[0]?.clientY ?? null;
    };

    const onTouchMove = (e) => {
      if (startY === null || busy) return;
      const dy = (e.touches?.[0]?.clientY ?? startY) - startY;
      if (dy <= 0 || window.scrollY > 0) {
        startY = null;
        currentPull = 0;
        setPull(0);
        return;
      }
      // Resistance curve so it feels rubbery near the cap.
      const damped = Math.min(maxPull, Math.sqrt(dy) * 8);
      currentPull = damped;
      setPull(damped);
    };

    const onTouchEnd = async () => {
      if (startY === null || busy) return;
      startY = null;
      if (currentPull >= threshold) {
        busy = true;
        setRefreshing(true);
        setPull(threshold);
        try {
          await onRefresh?.();
        } finally {
          busy = false;
          setRefreshing(false);
          currentPull = 0;
          setPull(0);
        }
      } else {
        currentPull = 0;
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onRefresh, threshold, maxPull, enabled]);

  return { pull, refreshing, threshold };
}
