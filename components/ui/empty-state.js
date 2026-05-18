import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   icon?: React.ComponentType<{ className?: string, strokeWidth?: number }>,
 *   emoji?: string,
 *   title: string,
 *   description?: string,
 *   actionLabel?: string,
 *   onAction?: () => void,
 *   actionHref?: string,
 *   className?: string,
 * }} props
 */
export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F7F5]">
        {Icon ? (
          <Icon className="h-7 w-7 text-[#9CA3AF]" strokeWidth={1.5} />
        ) : emoji ? (
          <span className="text-3xl leading-none" aria-hidden>
            {emoji}
          </span>
        ) : null}
      </div>
      <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-[260px] text-sm leading-relaxed text-[#6B7280]">
          {description}
        </p>
      ) : null}
      {actionLabel ? (
        actionHref ? (
          <Button className="mt-5" asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : onAction ? (
          <Button className="mt-5" type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null
      ) : null}
    </div>
  );
}
