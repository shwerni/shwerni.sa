// React & Next
import Image from "next/image";

// lib
import { cn } from "@/lib/utils";

// prisma
import { Gender } from "@/lib/generated/prisma/enums";

// props
interface Props {
  name?: string;
  gender: Gender;
  image: string | null;
  size?: "xs" | "sm" | "base" | "default" | "lg";
  variant?: "avatar" | "default";
  className?: string;
}

const sizes = {
  xs: "w-10 h-10",
  sm: "w-14 h-14",
  base: "w-16 h-16",
  default: "w-24 h-24",
  lg: "w-40 h-40",
} as const;

const ConsultantImage = ({
  name,
  gender,
  image,
  size = "default",
  className,
}: Props) => {
  const fallback =
    gender === Gender.MALE ? "/svg/man-avatar.svg" : "/svg/woman-avatar.svg";

  const src = image || fallback;

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0",
        sizes[size],
        className,
      )}
    >
      <Image
        src={src}
        alt={`consultant-${name || ""}`}
        fill
        sizes="160px"
        className="object-cover"
        quality={100}
        priority={false}
      />
    </div>
  );
};

export default ConsultantImage;
