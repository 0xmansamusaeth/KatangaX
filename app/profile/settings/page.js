"use client";

import {
  Bell,
  ChevronRight,
  HelpCircle,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { toast } from "@/components/ui/toast";

const ROWS = [
  { id: "notifications", icon: Bell, label: "Notification preferences" },
  { id: "security", icon: Lock, label: "Security & PIN" },
  { id: "privacy", icon: Shield, label: "Privacy & data" },
  { id: "contact", icon: Mail, label: "Contact details" },
  { id: "help", icon: HelpCircle, label: "Help & support" },
];

export default function SettingsPage() {
  return (
    <PageWrapper title="Settings" showBack>
      <p className="-mt-1 pb-4 text-sm text-[#6B7280]">
        Manage how KatangaX works on this device.
      </p>
      <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {ROWS.map((r, idx) => {
          const Icon = r.icon;
          return (
            <li
              key={r.id}
              className={idx === 0 ? "" : "border-t border-[#F3F4F6]"}
            >
              <button
                type="button"
                onClick={() =>
                  toast(`${r.label} is coming soon.`, { variant: "info" })
                }
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F5F7F5]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F7F5] text-[#1B5E20]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="flex-1 text-sm font-medium text-[#1A1A1A]">
                  {r.label}
                </span>
                <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-[11px] text-[#9CA3AF]">
        KatangaX prototype · v0.1
      </p>
    </PageWrapper>
  );
}
