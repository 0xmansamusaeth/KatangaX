"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import {
  bottomNavPadding,
  bottomNavWithFabPadding,
} from "@/components/layout/layout-insets";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const HEADER_INNER_H_REM = 3.5; // h-14

const FAB_ROUTES = ["/dashboard", "/"];

/**
 * Scrollable page shell with optional fixed Header + spacing for bottom nav.
 * Omit `title` when the page provides its own top section (e.g. dashboard).
 *
 * @param {{ reserveFab?: boolean }} props.reserveFab — extra bottom padding for the dashboard FAB
 */
export function PageWrapper({
  children,
  title,
  showBack = false,
  showNotification = false,
  showSettings = false,
  settingsHref,
  className,
  reserveFab = false,
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthGuard();
  const hasHeader = title != null && title !== "";

  const showNavPadding = !isLoading && isAuthenticated;
  const needsFab =
    reserveFab || FAB_ROUTES.some((r) => pathname === r || pathname === `${r}/`);

  const bottomPad = showNavPadding
    ? needsFab
      ? bottomNavWithFabPadding()
      : bottomNavPadding()
    : "calc(1.5rem + env(safe-area-inset-bottom, 0px))";

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
          className,
        )}
        style={{ paddingBottom: bottomPad }}
      >
        {children}
      </div>
    </>
  );
}
