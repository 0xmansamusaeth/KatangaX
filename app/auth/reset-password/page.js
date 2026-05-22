"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "number", label: "At least one number", test: (v) => /\d/.test(v) },
  { id: "upper", label: "At least one uppercase letter", test: (v) => /[A-Z]/.test(v) },
];

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Supabase appends `code` (PKCE) or `access_token`/`type=recovery` (hash).
  // We inspect both URL search and location.hash to detect a recovery link.
  const [mode, setMode] = useState("request");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const code = searchParams.get("code");
      const hash =
        typeof window !== "undefined" ? window.location.hash ?? "" : "";

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) {
            setMode("request");
          } else {
            setMode("update");
          }
          setReady(true);
        }
        return;
      }

      if (hash.includes("type=recovery") || hash.includes("access_token")) {
        if (!cancelled) {
          setMode("update");
          setReady(true);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setMode("update");
      } else {
        setMode("request");
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#F5F7F5] px-6 pb-12 pt-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/auth" className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B5E20] text-2xl font-bold text-white shadow-lg shadow-[#1B5E20]/20">
            KX
          </div>
        </Link>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          {!ready ? (
            <p className="text-sm text-[#6B7280]">Loading…</p>
          ) : mode === "update" ? (
            <UpdatePasswordForm router={router} />
          ) : (
            <RequestResetForm />
          )}
        </div>
      </div>
    </main>
  );
}

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const clean = email.trim().toLowerCase();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      clean,
      {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/reset-password`
            : undefined,
      },
    );
    setSubmitting(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setSentTo(clean);
  };

  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#16A34A]/15 text-[#166534]">
          <Mail className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            Reset link sent
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            We sent a reset link to{" "}
            <span className="font-semibold text-[#1A1A1A]">{sentTo}</span>. The
            link will sign you in to set a new password.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A]">
          Reset your password
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Enter the email you signed up with and we&apos;ll send a reset link.
        </p>
      </div>
      <div>
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-[#DC2626]/10 px-3 py-2 text-xs font-medium text-[#991B1B]">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={submitting || !email}>
        {submitting ? "Sending…" : "Send Reset Link"}
      </Button>
      <p className="text-center text-xs">
        <Link href="/auth" className="font-semibold text-[#1B5E20] hover:underline">
          Back to Sign In
        </Link>
      </p>
    </form>
  );
}

function UpdatePasswordForm({ router }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const ruleStates = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );
  const allRulesPass = ruleStates.every((r) => r.passed);
  const match = confirm === password && confirm.length > 0;

  useEffect(() => {
    if (!done) return undefined;
    const t = window.setTimeout(() => router.replace("/auth"), 2000);
    return () => window.clearTimeout(t);
  }, [done, router]);

  const submit = async (e) => {
    e.preventDefault();
    if (!allRulesPass || !match) return;
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#16A34A]/15 text-[#166534]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-base font-semibold text-[#1A1A1A]">
          Password updated!
        </h2>
        <p className="text-sm text-[#6B7280]">
          Sign in with your new password.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A]">
          Set a new password
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Choose a strong password you don&apos;t use anywhere else.
        </p>
      </div>
      <div>
        <Label htmlFor="new-pw">New password</Label>
        <div className="relative">
          <Input
            id="new-pw"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <Label htmlFor="new-pw-confirm">Confirm new password</Label>
        <Input
          id="new-pw-confirm"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirm && !match ? (
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
        disabled={submitting || !allRulesPass || !match}
      >
        {submitting ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}
