"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the component has hydrated on the client.
 * Use this to gate UI that depends on `new Date()`, `localStorage`,
 * `window`, or other client-only context so it never renders
 * differently between SSR and the first client paint.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
