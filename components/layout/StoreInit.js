"use client";

import { useEffect } from "react";
import { consumeStoreRecovery, getState } from "@/lib/store";
import { toast } from "@/components/ui/toast";

/**
 * Mounts once at the root layout. Touches the store once on mount so
 * `readRaw()` runs and can flag corruption, then surfaces a warning
 * toast if local data had to be reset to seed.
 */
export function StoreInit() {
  useEffect(() => {
    // Force a read so corruption is detected even before any hook fires.
    getState();
    const reason = consumeStoreRecovery();
    if (reason) {
      toast(
        reason === "parse"
          ? "Your saved data looked corrupted, so we restored the demo state."
          : "We had to reset some saved data due to a version mismatch.",
        { variant: "warning" },
      );
    }
  }, []);
  return null;
}
