// React & Next
import Image from "next/image";

// utils
import { cn } from "@/utils/utils";

// props
interface Props {
  name: string;
  logo: string | null;
  // px
  size: number;
  // accent: monogram on the center's accent; neutral: on muted (directory)
  tone?: "accent" | "neutral";
  className?: string;
}

// the monogram letter: the first letter of the name, skipping a leading "مركز"
export const centerMonogram = (name: string) => {
  const words = name.trim().split(/\s+/);
  const word = words[0] === "مركز" && words[1] ? words[1] : (words[0] ?? "");
  return word.charAt(0) || "م";
};

// a center's logo, or its monogram in a rounded square when there is none
export function CenterLogo({ name, logo, size, tone = "accent", className }: Props) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-2xl",
        !logo &&
          (tone === "accent"
            ? "bg-(--center-accent) text-(--center-accent-foreground)"
            : "bg-muted text-foreground/70"),
        logo && "bg-card",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {logo ? (
        <Image
          src={logo}
          alt={`شعار ${name}`}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <span className="font-bold" style={{ fontSize: Math.round(size * 0.42) }}>
          {centerMonogram(name)}
        </span>
      )}
    </span>
  );
}
