"use client";

import { Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const METHODS = [
  {
    id: "mtn",
    name: "MTN Mobile Money",
    masked: "**** 4567",
    color: "#FFC107",
    isDefault: true,
  },
  {
    id: "airtel",
    name: "Airtel Money",
    masked: "**** 8901",
    color: "#DC2626",
    isDefault: false,
  },
];

export function PaymentMethodsCard() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-[#1A1A1A]">Payment Methods</h3>
      <ul className="space-y-2">
        {METHODS.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: m.color }}
              aria-hidden
            >
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1A1A1A]">
                {m.name}
              </p>
              <p className="text-xs text-[#6B7280]">{m.masked}</p>
            </div>
            {m.isDefault ? (
              <span className="shrink-0 rounded-full bg-[#1B5E20]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1B5E20]">
                Default
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() =>
          toast("Adding payment methods is coming soon.", { variant: "info" })
        }
      >
        <Plus className="h-4 w-4" />
        Add Payment Method
      </Button>
    </section>
  );
}
