"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";

const AuthContext = createContext(null);

// Pages where we should *not* push an authed-but-profileless user to
// /create-profile. The user might already be there, completing it, or
// might be on /auth flows that own the redirect themselves.
const PROFILE_REDIRECT_EXEMPT = [
  "/create-profile",
  "/auth",
  "/connect-wallet",
];

function isExemptPath(pathname) {
  if (!pathname) return false;
  return PROFILE_REDIRECT_EXEMPT.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Client-side auth provider. Tracks the Supabase session globally so that
 * any component can call `useAuth()` / `useAuthGuard()` without each
 * subscribing to its own copy of `onAuthStateChange`.
 *
 * Also owns the AuthPromptModal that gets opened when a guest tries to
 * trigger a protected action, and a small post-auth router that pushes
 * confirmed users with no profile row to /create-profile (the email
 * confirmation flow lands them on /dashboard).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // If we have a session but no profile row yet (first sign-in after
  // email confirmation), send the user to /create-profile. We deliberately
  // skip this for the pages where the user is already mid-flow.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (loading) return;
    if (!userId) return;
    if (isExemptPath(pathname)) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      // We treat "no row" as "needs profile". Genuine read errors (RLS
      // misconfig, network) are left alone — better to let the user use
      // the app than to bounce them in a redirect loop.
      if (!error && !data) {
        router.replace("/create-profile");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, loading, pathname, router]);

  const openPrompt = useCallback((action) => {
    setPrompt({ action: action ?? "default" });
  }, []);

  const closePrompt = useCallback(() => setPrompt(null), []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      isLoading: loading,
      openPrompt,
      closePrompt,
    }),
    [session, loading, openPrompt, closePrompt],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthPromptModal
        open={Boolean(prompt)}
        action={prompt?.action}
        onClose={closePrompt}
      />
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Allow components used at the very top of the tree to render before
    // the provider is wired (e.g. server components that import a guarded
    // child without an auth provider) — return a safe inert default.
    return {
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      openPrompt: () => {},
      closePrompt: () => {},
    };
  }
  return ctx;
}
