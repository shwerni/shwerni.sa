// components
import { Badge } from "@/components/ui/badge";

// utils
import { cn } from "@/lib/utils";

// icons
import { FaStar } from "react-icons/fa";

// props
interface Props {
  rate: number | null;
  className?: string;
  variant?: "white" | "yellow";
  size?: "xs" | "sm" | "default" | "lg";
}

// variants
const variants = {
  yellow: "bg-[#FDB022]",
  white: "bg-white",
} as const;

// sizes
const sizes = {
  xs: "px-1.5 py-0.5 text-[10px] gap-1",
  sm: "px-2 py-0.5 text-xs gap-1.5",
  default: "px-2.5 py-1 text-sm gap-2",
  lg: "px-3 py-1.5 text-base gap-2.5",
} as const;

// icon sizes
const iconSizes = {
  xs: "text-[10px]",
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base",
} as const;

const StarBadge = ({
  rate,
  className,
  variant = "yellow",
  size = "default",
}: Props) => {
  if (!rate || rate < 1) return null;

  return (
    <Badge
      className={cn(
        "flex items-center justify-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      <FaStar
        className={cn(
          variant == "white" ? "text-[#FAC817]" : "text-white",
          iconSizes[size],
        )}
      />
      <span
        className={cn(
          "font-semibold",
          variant == "white" ? "text-gray-400" : "text-white",
        )}
      >
        {Number(rate).toFixed(1)}
      </span>
    </Badge>
  );
};

export default StarBadge;
