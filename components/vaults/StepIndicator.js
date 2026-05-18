import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   steps: { id: number, label: string }[],
 *   currentStep: number,
 * }} props
 */
export function StepIndicator({ steps, currentStep }) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((s, idx) => {
        const completed = idx < currentStep;
        const active = idx === currentStep;
        const isLast = idx === steps.length - 1;
        return (
          <li key={s.id} className="flex flex-1 items-start">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  completed
                    ? "border-[#1B5E20] bg-[#1B5E20] text-white"
                    : active
                      ? "border-[#1B5E20] bg-[#1B5E20] text-white shadow-[0_0_0_4px_rgba(27,94,32,0.15)]"
                      : "border-[#D1D5DB] bg-white text-[#9CA3AF]",
                )}
              >
                {completed ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[11px] font-medium",
                  active || completed ? "text-[#1A1A1A]" : "text-[#9CA3AF]",
                )}
              >
                {s.label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "mx-1 mt-[18px] h-0.5 flex-1 rounded-full",
                  completed ? "bg-[#1B5E20]" : "bg-[#E5E7EB]",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
