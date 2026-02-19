// React & Next
import React from "react";
import Image from "next/image";

// lib
import { cn } from "@/lib/utils";
import { Gender } from "@/lib/generated/prisma/enums";

// props
interface Props {
  image?: string | null;
  gender?: Gender;
  className?: string;
}

const ConsultantImage: React.FC<Props> = ({ image, gender, className }) => {
  // src
  const src = image
    ? image
    : gender === Gender.MALE
      ? "/layout/male.jpg"
      : "/layout/female.jpg";
  // return
  return (
    <Image
      src={src}
      alt="consultant"
      width={500}
      height={500}
      className={cn([
        className,
        "w-24 h-24 bg-zwhites-50 rounded-full object-center",
      ])}
    />
  );
};

export default ConsultantImage;
