// React & Next
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Props
interface Props {
  title: string;
  subTitle: string;
  variant?: "light" | "dark";
}

const Title: React.FC<Props> = ({
  title,
  subTitle,
  variant = "dark",
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-between gap-1">
      <h5
        className={cn(
          "text-base font-normal",
          variant === "dark" ? "text-black" : "text-white"
        )}
      >
        {subTitle}
      </h5>
      <div className="flex items-end gap-4">
        <Image
          src="/svg/shwerni-logo-r.svg"
          alt="shwerni"
          width={12}
          height={12}
        />
        <h2
          className={cn(
            "text-xl font-semibold",
            variant === "dark" ? "text-black" : "text-white"
          )}
        >
          {title}
        </h2>
        <Image
          src="/svg/shwerni-logo-l.svg"
          alt="shwerni"
          width={12}
          height={12}
        />
      </div>
    </div>
  );
};

export default Title;
