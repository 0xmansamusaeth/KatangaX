"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Star } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { sanitizeMessage } from "@/lib/validation";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "compliment", label: "Compliment" },
];

const HIDDEN_PATHS = ["/onboarding", "/connect-wallet", "/auth/callback"];

export function FeedbackWidget() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const reset = () => {
    setRating(0);
    setCategory("suggestion");
    setMessage("");
  };

  const submit = async () => {
    const clean = sanitizeMessage(message, 2000);
    if (!rating) {
      toast("Please give us a star rating", { variant: "error" });
      return;
    }
    if (clean.length < 3) {
      toast("Tell us a bit more — at least 3 characters", { variant: "error" });
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("submit_feedback", {
      p_rating: rating,
      p_category: category,
      p_message: clean,
      p_page_url: pathname,
      p_user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    setSubmitting(false);
    if (error) {
      toast(`Couldn't submit: ${error.message}`, { variant: "error" });
      return;
    }
    toast("Thanks for your feedback! 🙏", { variant: "success" });
    reset();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 z-[60] -translate-y-1/2 rounded-l-lg bg-[#1B5E20] px-2 py-3 text-[10px] font-semibold uppercase tracking-wide text-white shadow-lg [writing-mode:vertical-rl] hover:bg-[#164D1A]"
        aria-label="Send feedback"
      >
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          Feedback
        </span>
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Send feedback"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className={cn(
                    "rounded-full p-1.5 transition-colors",
                    n <= rating
                      ? "text-[#FFC107]"
                      : "text-[#D1D5DB] hover:text-[#FFC107]",
                  )}
                >
                  <Star
                    className="h-7 w-7"
                    fill={n <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Category
            </p>
            <div className="mt-2 flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                    category === c.value
                      ? "border-[#1B5E20] bg-[#1B5E20] text-white"
                      : "border-border bg-white text-[#4B5563]",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback-message"
              className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]"
            >
              Message
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What's on your mind?"
              className="mt-2 w-full resize-none rounded-xl border border-border bg-white p-3 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#1B5E20] focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20"
            />
            <p className="mt-1 text-right text-[10px] text-[#9CA3AF]">
              {message.length}/2000
            </p>
          </div>

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "Sending…" : "Send"}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
