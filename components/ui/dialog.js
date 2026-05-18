"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   description?: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   variant?: "default"|"destructive"|"accent",
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmVariant =
    variant === "destructive"
      ? "destructive"
      : variant === "accent"
        ? "accent"
        : "default";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Cancel"
        className="animate-overlay-in absolute inset-0 bg-black/45"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            className="flex-1"
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
