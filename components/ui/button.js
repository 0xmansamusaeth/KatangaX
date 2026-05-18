"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden rounded-md text-sm font-medium ring-offset-background transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-light",
        accent: "bg-accent text-text-primary hover:bg-accent-light",
        outline:
          "border border-border bg-surface hover:bg-background text-text-primary",
        ghost: "hover:bg-background text-text-primary",
        destructive: "bg-error text-white hover:bg-error/90",
        secondary:
          "border border-border bg-background text-text-primary hover:bg-surface",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Ripples are rendered as growing translucent circles anchored at the
// pointer-down location. They're skipped for `asChild` buttons because
// Radix Slot replaces the wrapper and we can't safely inject children.
function useRipples() {
  const [ripples, setRipples] = React.useState([]);
  const onPointerDown = React.useCallback((e) => {
    const el = e.currentTarget;
    if (!el || el.disabled) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    setRipples((r) => [...r, { id, x, y, size }]);
    window.setTimeout(() => {
      setRipples((r) => r.filter((rr) => rr.id !== id));
    }, 600);
  }, []);
  return { ripples, onPointerDown };
}

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    // asChild path: Slot enforces a single child, so we hand it the raw
    // child (no ripple decoration) and let it inherit the styles.
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return <ButtonWithRipple ref={ref} className={classes} {...props}>
      {children}
    </ButtonWithRipple>;
  },
);

const ButtonWithRipple = React.forwardRef(
  ({ className, children, onPointerDown, ...props }, ref) => {
    const { ripples, onPointerDown: rippleDown } = useRipples();
    const handlePointerDown = (e) => {
      rippleDown(e);
      onPointerDown?.(e);
    };
    return (
      <button
        ref={ref}
        className={className}
        {...props}
        onPointerDown={handlePointerDown}
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        >
          {ripples.map((r) => (
            <span
              key={r.id}
              className="absolute animate-ripple rounded-full bg-white/35"
              style={{
                left: r.x - r.size / 2,
                top: r.y - r.size / 2,
                width: r.size,
                height: r.size,
              }}
            />
          ))}
        </span>
      </button>
    );
  },
);
ButtonWithRipple.displayName = "ButtonWithRipple";
Button.displayName = "Button";

export { Button, buttonVariants };
