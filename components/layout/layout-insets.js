/** Fixed bottom nav: min-h-16 row + safe-area padding on inner flex */
export const BOTTOM_NAV_REM = 4;

/** Extra scroll padding below nav so bottom buttons stay tappable */
export const BOTTOM_NAV_BUFFER_REM = 1.5;

/** FAB (h-14) sits above nav — clearance for dashboard scroll content */
export const FAB_CLEARANCE_REM = 4.25;

export function bottomNavPadding(safeArea = true) {
  const safe = safeArea
    ? " + env(safe-area-inset-bottom, 0px)"
    : "";
  return `calc(${BOTTOM_NAV_REM}rem + ${BOTTOM_NAV_BUFFER_REM}rem${safe})`;
}

export function bottomNavWithFabPadding(safeArea = true) {
  const safe = safeArea
    ? " + env(safe-area-inset-bottom, 0px)"
    : "";
  return `calc(${BOTTOM_NAV_REM}rem + ${FAB_CLEARANCE_REM}rem + ${BOTTOM_NAV_BUFFER_REM}rem${safe})`;
}
