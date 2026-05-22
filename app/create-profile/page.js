"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { toE164 } from "@/lib/supabase/phone";
import {
  isValidUsername,
  normaliseUsername,
  sanitizeText,
} from "@/lib/validation";

const AVATAR_PALETTE = [
  "#1B5E20",
  "#2E7D32",
  "#0D9488",
  "#0F766E",
  "#1E40AF",
  "#7C3AED",
  "#BE185D",
  "#C2410C",
];

function randomColor() {
  return AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
}

function randomUsername(prefix) {
  const base = (prefix ?? "user").toLowerCase().replace(/[^a-z0-9]/g, "");
  const tail = Math.random().toString(36).slice(2, 7);
  return `${base.slice(0, 12) || "user"}_${tail}`;
}

/**
 * Map Postgres / Supabase error codes to human messages.
 * - 42501  — RLS policy denied the insert. Most often a stale anon JWT
 *            (the session cookie hadn't propagated yet) or the project
 *            doesn't have the profiles_insert_own policy installed yet.
 * - 23505  — unique violation (username/phone collision).
 * - 23502  — NOT NULL violation (legacy phone_number NOT NULL constraint).
 * - 23514  — check constraint (username format).
 */
function humaniseProfileError(error) {
  const code = error?.code;
  if (code === "42501") {
    return "Permission denied. Sign out and sign back in, then try again.";
  }
  if (code === "23505") {
    const msg = String(error?.message ?? "").toLowerCase();
    if (msg.includes("username")) return "That username is already taken.";
    if (msg.includes("phone")) {
      return "That phone number is already linked to another account.";
    }
    return "Something with that information already exists.";
  }
  if (code === "23502") {
    return "A required field was missing. Make sure your name and username are filled in.";
  }
  if (code === "23514") {
    return "Username must be 3–20 lowercase letters, numbers, or underscores.";
  }
  return error?.message || "Couldn't save your profile. Please try again.";
}

export default function CreateProfilePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Resolve the current session — and stay subscribed to auth changes so
  // we pick up the session even if it lands one tick after this page
  // mounts (which happens when the user just clicked their email
  // confirmation link).
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const handleSession = async (session) => {
      if (cancelled) return;
      const authUser = session?.user ?? null;
      if (!authUser) {
        router.replace("/auth");
        return;
      }
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", authUser.id)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        router.replace("/dashboard");
        return;
      }
      setUser(authUser);
      setFullName((prev) =>
        prev
          ? prev
          : sanitizeText(
              authUser.user_metadata?.full_name ??
                authUser.user_metadata?.name ??
                "",
            ),
      );
      setAuthChecked(true);
    };

    (async () => {
      const { data } = await supabase.auth.getSession();
      await handleSession(data.session);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  const checkUsername = useCallback(async (value) => {
    const u = normaliseUsername(value);
    if (!isValidUsername(u)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", u)
      .maybeSingle();
    setUsernameStatus(data ? "taken" : "available");
  }, []);

  useEffect(() => {
    if (!username) {
      setUsernameStatus("idle");
      return undefined;
    }
    const t = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(t);
  }, [username, checkUsername]);

  /**
   * Resolve a guaranteed-fresh session right before inserting. Falls back
   * to `/auth` if the session was lost since mount.
   */
  const requireFreshSession = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      setFormError("Your session expired. Please sign in again.");
      router.replace("/auth");
      return null;
    }
    return data.session;
  }, [router]);

  /**
   * Race-safe insert: if a profile already exists for this user (e.g.
   * the form was double-submitted, or the user came back via the email
   * link twice) we short-circuit to /dashboard instead of failing on
   * the primary-key conflict.
   */
  const insertProfile = useCallback(async (row) => {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", row.id)
      .maybeSingle();
    if (existing) return { existed: true };
    const { error } = await supabase.from("profiles").insert(row);
    return { existed: false, error };
  }, []);

  const submit = async () => {
    if (!user || submitting) return;
    setFormError(null);

    const cleanName = sanitizeText(fullName);
    const cleanUsername = normaliseUsername(username);
    if (cleanName.length < 2) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!isValidUsername(cleanUsername) || usernameStatus !== "available") {
      setFormError("Please pick an available username.");
      return;
    }

    setSubmitting(true);
    const session = await requireFreshSession();
    if (!session) {
      setSubmitting(false);
      return;
    }

    const phoneE164 = phone.trim() ? toE164(phone) : null;

    const { existed, error } = await insertProfile({
      id: session.user.id,
      full_name: cleanName,
      username: cleanUsername,
      phone_number: phoneE164,
      avatar_color: randomColor(),
    });
    setSubmitting(false);

    if (existed) {
      router.replace("/dashboard");
      return;
    }
    if (error) {
      const msg = humaniseProfileError(error);
      setFormError(msg);
      toast(msg, { variant: "error" });
      // eslint-disable-next-line no-console
      console.error("[create-profile] insert failed:", error);
      return;
    }

    router.replace("/connect-wallet");
  };

  const skip = async () => {
    if (!user || submitting) return;
    setFormError(null);
    setSubmitting(true);

    const session = await requireFreshSession();
    if (!session) {
      setSubmitting(false);
      return;
    }

    const cleanName =
      sanitizeText(fullName) ||
      sanitizeText(
        session.user.user_metadata?.full_name ??
          session.user.email?.split("@")[0] ??
          "New User",
      );

    // Try a username derived from the email prefix first so it feels
    // personal; fall back to a random one if it's taken / invalid.
    const supabase = createClient();
    const emailPrefix = (session.user.email ?? "user")
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 15);

    const candidates = [
      isValidUsername(emailPrefix) ? emailPrefix : null,
      randomUsername(cleanName),
      randomUsername("user"),
    ].filter(Boolean);

    let pickedUsername = null;
    for (const candidate of candidates) {
      const { data: clash } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", candidate)
        .maybeSingle();
      if (!clash) {
        pickedUsername = candidate;
        break;
      }
    }
    if (!pickedUsername) pickedUsername = randomUsername("user");

    const { existed, error } = await insertProfile({
      id: session.user.id,
      full_name: cleanName,
      username: pickedUsername,
      avatar_color: randomColor(),
    });
    setSubmitting(false);

    if (existed) {
      router.replace("/dashboard");
      return;
    }
    if (error) {
      const msg = humaniseProfileError(error);
      setFormError(msg);
      toast(msg, { variant: "error" });
      // eslint-disable-next-line no-console
      console.error("[create-profile] skip insert failed:", error);
      return;
    }
    router.replace("/dashboard");
  };

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B5E20]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7F5] px-6 pb-12 pt-12">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Complete Your Profile</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Tell us a bit about yourself. You can update this anytime.
        </p>

        {formError ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#991B1B]"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <Label htmlFor="cp-name">Full Name</Label>
            <Input
              id="cp-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={(e) => setFullName(sanitizeText(e.target.value))}
              placeholder="Your name"
              maxLength={80}
            />
          </div>

          <div>
            <Label htmlFor="cp-username">Username</Label>
            <Input
              id="cp-username"
              value={username}
              onChange={(e) => setUsername(normaliseUsername(e.target.value))}
              placeholder="yourname"
              className="lowercase"
              maxLength={20}
            />
            {usernameStatus === "checking" ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking…
              </p>
            ) : null}
            {usernameStatus === "available" ? (
              <p className="mt-1 text-xs text-[#16A34A]">
                ✓ {normaliseUsername(username)} is available
              </p>
            ) : null}
            {usernameStatus === "taken" ? (
              <p className="mt-1 text-xs text-[#DC2626]">✗ Already taken</p>
            ) : null}
            {usernameStatus === "invalid" && username ? (
              <p className="mt-1 text-xs text-[#DC2626]">
                3–20 chars, lowercase letters, numbers, underscore only
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="cp-phone">Phone Number</Label>
            <div className="flex gap-2">
              <span className="flex h-10 items-center rounded-lg border border-border bg-white px-3 text-sm font-medium">
                +260
              </span>
              <Input
                id="cp-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="97 123 4567"
                className="flex-1"
              />
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">
              Used to find you by phone number (optional).
            </p>
          </div>
        </div>

        <Button
          type="button"
          className="mt-6 w-full"
          size="lg"
          disabled={
            submitting ||
            !fullName.trim() ||
            usernameStatus !== "available"
          }
          onClick={submit}
        >
          {submitting ? "Saving…" : "Continue"}
        </Button>

        <button
          type="button"
          onClick={skip}
          disabled={submitting}
          className="mt-4 w-full text-center text-xs font-medium text-[#6B7280] hover:underline disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}
