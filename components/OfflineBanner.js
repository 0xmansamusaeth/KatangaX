"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return undefined;
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.offline = online ? "false" : "true";
  }, [online]);

  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[90] flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-[430px] items-center gap-2 rounded-xl border border-[#FFC107]/40 bg-[#FFFBEB] px-3 py-2 text-xs shadow-sm">
        <WifiOff className="h-4 w-4 text-[#92400E]" />
        <p className="flex-1 font-medium text-[#92400E]">
          No internet connection. Transactions require an internet connection.
        </p>
      </div>
    </div>
  );
}

/**
 * Helper hook for buttons elsewhere in the app to disable on offline.
 */
export function useIsOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof navigator === "undefined") return undefined;
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
  return online;
}
