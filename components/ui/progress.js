import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef(({ className, value = 0, ...props }, ref) => {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-border",
        className,
      )}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
});
Progress.displayName = "Progress";

export { Progress };
