// React & Next
import Image from "next/image";

// prisma types
import { Gender } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/utils/utils";

// props
interface Props {
  name: string;
  image: string | null;
  gender: Gender;
  size: number;
  className?: string;
}

// a consultant photo on center pages, with the gender avatar when there is none
export function CenterAvatar({ name, image, gender, size, className }: Props) {
  const src =
    image ||
    (gender === Gender.MALE ? "/svg/man-avatar.svg" : "/svg/woman-avatar.svg");

  return (
    <Image
      src={src}
      alt={`صورة ${name}`}
      width={size}
      height={size}
      className={cn("rounded-2xl object-cover bg-slate-100", className)}
      style={{ width: size, height: size }}
    />
  );
}
