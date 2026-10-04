// utils
import { cn } from "@/utils/utils";

// types
import type { LucideIcon } from "lucide-react";

// props
interface Props {
  icon: LucideIcon;
  // accent: the center's tint; neutral: muted (directory, shared surfaces)
  tone?: "accent" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

// a small slim icon inside a soft rounded square
export function IconSquare({
  icon: Icon,
  tone = "accent",
  size = "md",
  className,
}: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        size === "md" ? "size-9" : "size-7 rounded-lg",
        tone === "accent"
          ? "bg-(--center-tint) text-(--center-accent-text)"
          : "bg-muted text-foreground/70",
        className,
      )}
    >
      <Icon
        className={size === "md" ? "size-[18px]" : "size-4"}
        strokeWidth={1.75}
      />
    </span>
  );
}
