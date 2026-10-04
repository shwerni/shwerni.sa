// utils
import { cn } from "@/utils/utils";

// props
interface Props {
  steps: string[];
  current: number;
}

// a slim progress indicator for the booking flow
export function BookingSteps({ steps, current }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" aria-hidden>
        {steps.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= current ? "bg-(--center-accent)" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        الخطوة {current + 1} من {steps.length} ·{" "}
        <span className="font-medium text-foreground">{steps[current]}</span>
      </p>
    </div>
  );
}
