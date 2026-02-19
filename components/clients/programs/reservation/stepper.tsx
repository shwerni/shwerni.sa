// components
import { cn } from "@/lib/utils";

// icons
import { Check } from "lucide-react";

export function Stepper({ steps, step }: { steps: string[]; step: number }) {
  return (
    <div className="flex w-11/12 pb-8 mx-auto">
      {steps.map((label, i) => (
        <div
          key={i}
          className={cn("relative flex", i !== steps.length - 1 && "flex-1")}
        >
          <div className="flex items-center w-full">
            {/* circle */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-theme transition-colors duration-700 ease-in-out",
                i < step && "bg-theme",
              )}
            >
              <span
                className={cn(
                  "font-semibold",
                  i < step ? "text-white" : "text-theme",
                )}
              >
                {i < step ? <Check className="w-5" /> : i + 1}
              </span>

              {/* label  */}
              <div className="absolute -bottom-6 left-1/2 w-24 -translate-x-1/2 text-center">
                <span
                  className={cn(
                    "text-sm font-medium",
                    i <= step ? "text-theme" : "text-gray-700",
                  )}
                >
                  {label}
                </span>
              </div>
            </div>

            {/* line */}
            {i !== steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-colors duration-700 ease-in-out",
                  i < step ? "bg-theme" : "bg-gray-300",
                )}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
