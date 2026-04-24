"use client";
// React & Next
import React from "react";

// components
import Stars from "@/components/clients/shared/stars";
import { LinkButton } from "@/components/shared/link-button";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// utils
import { cn } from "@/lib/utils";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";

// types
type OnlineConsultant = {
  userId: string;
  cid: number;
  name: string;
  image: string | null;
  gender: Gender;
  category: Categories;
  rate: number;
  cost30: number;
};

// props
interface Props extends React.HTMLAttributes<HTMLDivElement> {
  consultant: OnlineConsultant;
  onBook?: () => void;
}

export default function OnlineConsultantCard({
  consultant,
  onBook,
  className,
  ...props
}: Props) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className,
      )}
      {...props}
    >
      {/* Consultant Info */}
      <div className="flex items-center gap-4">
        {/* Image Wrapper with Online Indicator */}
        <div className="relative shrink-0">
          <ConsultantImage
            name={consultant.name}
            image={consultant.image}
            gender={consultant.gender}
            size="sm"
            priority
          />
          {/* Pulsing Green Dot */}
          <span className="absolute bottom-0 right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white"></span>
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-[#094577] font-bold text-lg leading-tight">
            {consultant.name}
          </h2>

          <div className="flex items-center gap-2">
            <CategoryBadge category={consultant.category} size="xs" />

            {consultant.rate > 0 && <Stars rate={consultant.rate} />}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <LinkButton
        href="/instant"
        onClick={onBook}
        variant="primary">
        احجز الآن
      </LinkButton>
    </div>
  );
}
