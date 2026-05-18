import { cn } from "@/lib/utils";

/**
 * Generic shimmer placeholder. Use during data load or before client
 * hydration to keep layout stable.
 *
 * @param {React.HTMLAttributes<HTMLDivElement> & { className?: string }} props
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#E5E7EB]",
        className,
      )}
      {...props}
    />
  );
}
