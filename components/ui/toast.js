"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT = "katangax:toast";
const EXIT_MS = 220;

/**
 * Fire a transient toast. Can be called from anywhere — the global
 * `<Toaster />` mounted in app/layout.js picks it up.
 *
 * @param {string} message
 * @param {{
 *   type?: "success"|"error"|"warning"|"info",
 *   variant?: "success"|"error"|"warning"|"info",
 *   duration?: number,
 * }} [options]
 */
export function toast(message, options = {}) {
  if (typeof window === "undefined") return;
  const variant = options.variant ?? options.type ?? "success";
  window.dispatchEvent(
    new CustomEvent(EVENT, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message,
        variant,
        duration: options.duration ?? 3000,
      },
    }),
  );
}

/**
 * Hook-style accessor for the toast function.
 */
export function useToast() {
  return toast;
}

const VARIANTS = {
  success: { Icon: CheckCircle2, tone: "text-[#16A34A]" },
  error: { Icon: XCircle, tone: "text-[#DC2626]" },
  warning: { Icon: AlertTriangle, tone: "text-[#D97706]" },
  info: { Icon: Info, tone: "text-[#1B5E20]" },
};

export function Toaster() {
  const [items, setItems] = useState(/** @type {any[]} */ ([]));

  useEffect(() => {
    function onAdd(e) {
      const t = /** @type {CustomEvent} */ (e).detail;
      setItems((prev) => [...prev, { ...t, leaving: false }]);
      window.setTimeout(() => {
        setItems((prev) =>
          prev.map((x) => (x.id === t.id ? { ...x, leaving: true } : x)),
        );
        window.setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.id !== t.id));
        }, EXIT_MS);
      }, t.duration);
    }
    window.addEventListener(EVENT, onAdd);
    return () => window.removeEventListener(EVENT, onAdd);
  }, []);

  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-[100] flex w-full max-w-[430px] -translate-x-1/2 flex-col-reverse gap-2 px-4"
      style={{
        bottom:
          "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((t) => {
        const v = VARIANTS[t.variant] ?? VARIANTS.success;
        const Icon = v.Icon;
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg",
              t.leaving ? "animate-toast-out" : "animate-toast-in",
            )}
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", v.tone)} />
            <p className="flex-1 text-sm font-medium leading-snug text-[#1A1A1A]">
              {t.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
