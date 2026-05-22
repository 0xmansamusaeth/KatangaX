import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * KatangaX runs in two modes:
 *  - GUEST MODE: most read/browse routes are accessible without auth
 *  - AUTHENTICATED MODE: required for vault actions, profile, notifications
 *
 * Below we declare the *protected* routes. Everything else is public.
 *
 * Note: `/vaults/[id]` (vault detail page) is intentionally public and
 * read-only for guests. Action buttons on that page enforce auth via
 * the in-app `useAuthGuard` prompt — we don't redirect at the route
 * level so guests can still see vault details.
 */
const PROTECTED_PREFIXES = [
  "/vaults/new",
  "/profile",
  "/notifications",
  "/payments",
  "/connect-wallet",
  "/create-profile",
];

const AUTH_PAGES = ["/auth"];

function isProtected(pathname) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAuthPage(pathname) {
  return AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isResetPasswordPage(pathname) {
  return (
    pathname === "/auth/reset-password" ||
    pathname.startsWith("/auth/reset-password/")
  );
}

/**
 * Refresh session and protect authenticated routes.
 * @param {import("next/server").NextRequest} request
 */
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Always allow the reset-password page (it carries the recovery code).
  if (isResetPasswordPage(pathname)) {
    return supabaseResponse;
  }

  // Signed-in user lands on /auth → bounce home.
  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Guest tries to open a protected route → save intent, send to /auth.
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    const intended = pathname + (request.nextUrl.search ?? "");
    url.search = `?next=${encodeURIComponent(intended)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
