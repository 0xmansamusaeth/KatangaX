"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toE164 } from "@/lib/supabase/phone";
import { toast } from "@/components/ui/toast";
import {
  isValidUsername,
  normaliseUsername,
  sanitizeText,
} from "@/lib/validation";

export default function OnboardingPage() {
  const router = useRouter();
  const [screen, setScreen] = useState("welcome");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pendingPhone, setPendingPhone] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);

  const e164 = toE164(phone);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

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
    if (screen !== "signup" || !username) return;
    const t = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(t);
  }, [username, screen, checkUsername]);

  const sendOtp = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (error) {
      toast(error.message, { variant: "error" });
      return;
    }
    setPendingPhone(e164);
    setScreen("otp");
    setResendIn(60);
    toast("Verification code sent");
  };

  const verifyOtp = async (code) => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: code,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      toast(error.message, { variant: "error" });
      return;
    }

    const user = data.user;
    if (!user) return;

    if (isSignUp) {
      const cleanName = sanitizeText(fullName);
      const cleanUsername = normaliseUsername(username);
      if (!cleanName || cleanName.length < 2) {
        toast("Please enter your full name", { variant: "error" });
        return;
      }
      if (!isValidUsername(cleanUsername)) {
        toast("Username can only contain lowercase letters, numbers and _", {
          variant: "error",
        });
        return;
      }
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: cleanName,
        phone_number: pendingPhone,
        username: cleanUsername,
        avatar_color: "#1B5E20",
      });

      if (profileErr) {
        toast(profileErr.message, { variant: "error" });
        return;
      }
      router.replace("/connect-wallet");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.wallet_address) {
      router.replace("/dashboard");
    } else {
      router.replace("/connect-wallet");
    }
  };

  const onOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d.length === 1)) {
      verifyOtp(next.join(""));
    }
  };

  if (screen === "welcome") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1B5E20] text-3xl font-bold text-white">
          KX
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#1A1A1A]">KatangaX</h1>
        <p className="mt-2 text-center text-sm text-[#6B7280]">
          Community savings, powered by Web3
        </p>
        <Button
          className="mt-10 w-full max-w-sm"
          size="lg"
          onClick={() => {
            setIsSignUp(true);
            setScreen("signup");
          }}
        >
          Get Started
        </Button>
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[#1B5E20]"
          onClick={() => {
            setIsSignUp(false);
            setScreen("signin");
          }}
        >
          I already have an account
        </button>
      </main>
    );
  }

  if (screen === "signup") {
    return (
      <main className="min-h-screen px-6 pb-24 pt-8">
        <h2 className="text-xl font-bold">Create account</h2>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={(e) => setFullName(sanitizeText(e.target.value))}
              placeholder="Your name"
              maxLength={80}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <span className="flex h-10 items-center rounded-lg border border-border bg-white px-3 text-sm font-medium">
                +260
              </span>
              <Input
                id="phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="97 123 4567"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(normaliseUsername(e.target.value))}
              onBlur={() => checkUsername(username)}
              placeholder="yourname"
              className="lowercase"
              maxLength={20}
            />
            {usernameStatus === "available" ? (
              <p className="mt-1 text-xs text-[#16A34A]">✓ Username available</p>
            ) : null}
            {usernameStatus === "taken" ? (
              <p className="mt-1 text-xs text-[#DC2626]">✗ Username taken</p>
            ) : null}
            {usernameStatus === "invalid" && username ? (
              <p className="mt-1 text-xs text-[#DC2626]">
                3–20 chars, lowercase letters, numbers, underscore only
              </p>
            ) : null}
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={
              loading ||
              !fullName.trim() ||
              !phone.trim() ||
              usernameStatus !== "available"
            }
            onClick={sendOtp}
          >
            Send OTP
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-[#6B7280]"
            onClick={() => setScreen("welcome")}
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  if (screen === "signin") {
    return (
      <main className="min-h-screen px-6 pb-24 pt-8">
        <h2 className="text-xl font-bold">Sign in</h2>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="phone-in">Phone Number</Label>
            <div className="flex gap-2">
              <span className="flex h-10 items-center rounded-lg border border-border bg-white px-3 text-sm font-medium">
                +260
              </span>
              <Input
                id="phone-in"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="97 123 4567"
                className="flex-1"
              />
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={loading || !phone.trim()}
            onClick={sendOtp}
          >
            Send OTP
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-[#6B7280]"
            onClick={() => setScreen("welcome")}
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 pb-24 pt-8">
      <h2 className="text-xl font-bold">Verify your phone</h2>
      <p className="mt-2 text-sm text-[#6B7280]">
        Enter the 6-digit code sent to {pendingPhone}
      </p>
      <div className="mt-8 flex justify-center gap-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => onOtpChange(i, e.target.value)}
            className="h-12 w-11 rounded-lg border-2 border-border text-center text-lg font-bold focus:border-[#1B5E20] focus:outline-none"
          />
        ))}
      </div>
      <button
        type="button"
        disabled={resendIn > 0 || loading}
        className="mt-6 w-full text-center text-sm font-semibold text-[#1B5E20] disabled:text-[#9CA3AF]"
        onClick={sendOtp}
      >
        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
      </button>
    </main>
  );
}
