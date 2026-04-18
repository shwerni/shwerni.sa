// React & Next
import React from "react";

// utils
import { cn } from "@/lib/utils";

//  icons
import { Check } from "lucide-react";

export function Stepper({ steps, step }: { steps: string[]; step: number }) {
  return (
    <div className="z-50 w-full flex justify-center pointer-events-none px-4 py-2.5">
      <div className="bg-white/90 backdrop-blur-md shadow-sm border border-gray-200/60 rounded-full px-3 py-2 flex items-center justify-center gap-1.5 transition-all">
        {steps.map((label, i) => {
          const isActive = i === step;
          const isPast = i < step;

          return (
            <React.Fragment key={i}>
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-500",
                  isActive
                    ? "bg-theme text-white px-3 py-1"
                    : isPast
                      ? "bg-theme/10 text-theme w-6 h-6"
                      : "bg-gray-100 text-gray-400 w-6 h-6",
                )}
              >
                {isPast ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[11px] font-semibold whitespace-nowrap">
                    {isActive ? label : i + 1}
                  </span>
                )}
              </div>

              {i !== steps.length - 1 && (
                <div
                  className={cn(
                    "w-3 h-0.5 rounded-full transition-colors",
                    isPast ? "bg-theme/40" : "bg-gray-200",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
