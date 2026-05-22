"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { sanitizeText } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { REDIRECT_KEY } from "@/components/auth/AuthPromptModal";

const TABS = [
  { value: "signin", label: "Sign In" },
  { value: "signup", label: "Sign Up" },
];

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "number", label: "At least one number", test: (v) => /\d/.test(v) },
  { id: "upper", label: "At least one uppercase letter", test: (v) => /[A-Z]/.test(v) },
];

const HUMAN_ERRORS = [
  {
    match: /already registered|already.*exist|user already/i,
    text: "An account with this email already exists. Sign in instead.",
  },
  {
    match: /password.*least.*6|password.*at least/i,
    text: "Password must be at least 8 characters.",
  },
  {
    match: /invalid login|invalid credentials/i,
    text: "Invalid email or password. Please try again.",
  },
  {
    match: /email not confirmed/i,
    text: "Please confirm your email first. Check your inbox.",
  },
  {
    match: /rate limit|too many/i,
    text: "Too many attempts. Please wait a moment and try again.",
  },
];

function humaniseError(err) {
  const msg = err?.message ?? String(err ?? "");
  for (const rule of HUMAN_ERRORS) {
    if (rule.match.test(msg)) return rule.text;
  }
  return msg || "Something went wrong. Please try again.";
}

function readRedirect() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(REDIRECT_KEY);
  } catch {
    return null;
  }
}

function clearRedirect() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(REDIRECT_KEY);
  } catch {
    /* ignore */
  }
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = params.get("tab") === "signup" ? "signup" : "signin";
    setTab(tabParam);
    // Middleware redirects unauthenticated users to /auth?next=/intended/path.
    // Persist that to sessionStorage so it survives the post-auth navigation.
    const next = params.get("next");
    if (next && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(REDIRECT_KEY, next);
      } catch {
        /* ignore */
      }
    }
  }, [params]);

  return (
    <main className="min-h-screen bg-[#F5F7F5] px-6 pb-12 pt-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/dashboard" className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B5E20] text-2xl font-bold text-white shadow-lg shadow-[#1B5E20]/20">
            KX
          </div>
        </Link>
        <h1 className="mt-4 text-center text-xl font-bold text-[#1A1A1A]">
          Welcome to KatangaX
        </h1>

        <div className="mt-6 inline-flex w-full rounded-full bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "flex-1 rounded-full py-2 text-sm font-semibold transition-colors",
                tab === t.value
                  ? "bg-[#1B5E20] text-white shadow"
                  : "text-[#4B5563]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          {tab === "signin" ? (
            <SignInForm onSwitch={() => setTab("signup")} router={router} />
          ) : (
            <SignUpForm onSwitch={() => setTab("signin")} />
          )}
        </div>
      </div>
    </main>
  );
}

function SignInForm({ onSwitch, router }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setSubmitting(false);
    if (authErr) {
      setError(humaniseError(authErr));
      return;
    }
    const user = data.user;
    if (!user) {
      setError("Sign in failed. Please try again.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const redirect = readRedirect();
    clearRedirect();

    if (!profile) {
      router.replace("/create-profile");
      return;
    }
    router.replace(redirect || "/dashboard");
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div>
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="signin-pw">Password</Label>
        <div className="relative">
          <Input
            id="signin-pw"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#6B7280] hover:text-[#1A1A1A]"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-[#DC2626]/10 px-3 py-2 text-xs font-medium text-[#991B1B]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting || !email || !password}
      >
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link
          href="/auth/reset-password"
          className="font-medium text-[#1B5E20] hover:underline"
        >
          Forgot your password?
        </Link>
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-[#1B5E20] hover:underline"
        >
          Create account
        </button>
      </div>
    </form>
  );
}

function SignUpForm({ onSwitch }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const ruleStates = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );
  const allRulesPass = ruleStates.every((r) => r.passed);
  const confirmMismatch = confirmTouched && confirm && confirm !== password;
  const canSubmit =
    fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    allRulesPass &&
    confirm === password;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    const supabase = createClient();
    const cleanName = sanitizeText(fullName);
    const cleanEmail = email.trim().toLowerCase();
    const { data, error: signErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName },
        // After the user clicks the email confirmation link, Supabase
        // redirects them back to this URL with a session in the hash.
        // The /dashboard route handles the rest: if the new user has no
        // profile row yet, AuthContext routes them to /create-profile.
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/dashboard`
            : undefined,
      },
    });
    setSubmitting(false);
    if (signErr) {
      setError(humaniseError(signErr));
      return;
    }
    setSuccess({ email: cleanEmail, requiresConfirm: !data.session });
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#16A34A]/15 text-[#166534]">
          <Mail className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            ✅ Check your email to confirm your account
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-[#1A1A1A]">{success.email}</span>
            . Click it to activate your account, then sign in.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onSwitch}
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div>
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={(e) => setFullName(sanitizeText(e.target.value))}
          placeholder="Jane Doe"
          maxLength={80}
        />
      </div>
      <div>
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="signup-pw">Password</Label>
        <div className="relative">
          <Input
            id="signup-pw"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#6B7280] hover:text-[#1A1A1A]"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {ruleStates.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-1.5",
                r.passed ? "text-[#16A34A]" : "text-[#9CA3AF]",
              )}
            >
              <CheckCircle2
                className="h-3.5 w-3.5"
                fill={r.passed ? "currentColor" : "none"}
              />
              {r.label}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <Label htmlFor="signup-confirm">Confirm Password</Label>
        <Input
          id="signup-confirm"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
          placeholder="Re-enter your password"
        />
        {confirmMismatch ? (
          <p className="mt-1 text-xs text-[#DC2626]">Passwords don&apos;t match</p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg bg-[#DC2626]/10 px-3 py-2 text-xs font-medium text-[#991B1B]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting || !canSubmit}
      >
        {submitting ? "Creating…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-[#6B7280]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-[#1B5E20] hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
