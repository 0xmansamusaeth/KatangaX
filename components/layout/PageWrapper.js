import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";

const HEADER_INNER_H_REM = 3.5; // h-14
const NAV_INNER_MIN_REM = 4; // min-h-16

/**
 * Scrollable page shell with optional fixed Header + spacing for bottom nav.
 * Omit `title` when the page provides its own top section (e.g. dashboard).
 */
export function PageWrapper({
  children,
  title,
  showBack = false,
  showNotification = false,
  showSettings = false,
  settingsHref,
  className,
}) {
  const hasHeader = title != null && title !== "";

  return (
    <>
      {hasHeader ? (
        <Header
          title={title}
          showBack={showBack}
          showNotification={showNotification}
          showSettings={showSettings}
          settingsHref={settingsHref}
        />
      ) : null}
      <div
        className={cn(
          "min-h-screen w-full overflow-x-hidden overflow-y-auto px-4",
          hasHeader
            ? `pt-[calc(${HEADER_INNER_H_REM}rem+env(safe-area-inset-top,0px))]`
            : `pt-[calc(1rem+env(safe-area-inset-top,0px))]`,
          `pb-[calc(${NAV_INNER_MIN_REM}rem+env(safe-area-inset-bottom,0px)+0.25rem)]`,
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
