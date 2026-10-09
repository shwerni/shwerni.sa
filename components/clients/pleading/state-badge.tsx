// prisma types
import { PleadingState } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/utils/utils";
import { pleadingStateLabels } from "@/utils/pleading";

const tones: Record<PleadingState, string> = {
  DRAFT: "bg-slate-100 text-slate-500",
  REQUESTED: "bg-amber-50 text-amber-700 border-amber-100",
  QUOTED: "bg-theme-50 text-theme-700 border-theme-100",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-100",
  DECLINED: "bg-slate-100 text-slate-500",
  EXPIRED: "bg-slate-100 text-slate-500",
  CANCELED: "bg-slate-100 text-slate-500",
};

// the case state as a small pill
export function PleadingStateBadge({
  state,
  className,
}: {
  state: PleadingState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium",
        tones[state],
        className,
      )}
    >
      {pleadingStateLabels[state]}
    </span>
  );
}
