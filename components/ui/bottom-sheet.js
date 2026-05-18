"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slide-up bottom sheet with backdrop, drag handle (swipe-down to close)
 * and basic focus management.
 *
 * Accepts `isOpen` (preferred) or `open` (legacy).
 *
 * @param {{
 *   isOpen?: boolean,
 *   open?: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   children?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export function BottomSheet({
  isOpen,
  open,
  onClose,
  title,
  children,
  className,
}) {
  const visible = isOpen ?? open ?? false;
  const sheetRef = useRef(null);
  const closeBtnRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    previouslyFocused.current =
      typeof document !== "undefined" ? document.activeElement : null;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus?.();
    }, 60);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      if (previouslyFocused.current?.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible) return undefined;
    const el = sheetRef.current;
    if (!el) return undefined;

    let startY = 0;
    let dy = 0;
    let dragging = false;

    const onPointerDown = (e) => {
      dragging = true;
      startY = e.clientY;
      dy = 0;
      el.style.transition = "none";
      el.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      el.style.transform = `translateY(${dy}px)`;
    };
    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      el.style.transition = "transform 220ms ease";
      if (dy > 110) {
        el.style.transform = "translateY(100%)";
        window.setTimeout(() => onClose?.(), 200);
      } else {
        el.style.transform = "translateY(0)";
      }
    };

    const handle = el.querySelector("[data-sheet-handle]");
    if (!handle) return undefined;
    handle.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close sheet"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-sheet-up relative z-10 w-full max-w-[430px] rounded-t-3xl bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)]",
          className,
        )}
        style={{
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div
          data-sheet-handle
          className="flex cursor-grab touch-none items-center justify-center pt-2.5 active:cursor-grabbing"
        >
          <div className="h-1.5 w-10 rounded-full bg-[#E5E7EB]" />
        </div>
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>
          {onClose ? (
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-[#4B5563] hover:bg-[#F5F7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        <div className="px-5 pb-4 pt-2">{children}</div>
      </div>
    </div>
  );
}
