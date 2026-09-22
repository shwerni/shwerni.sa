"use client";
import React from "react";

// components
import { Button } from "@/components/ui/button";
import Stars from "@/components/clients/shared/stars";
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
      dir="rtl"
      className={cn(
        "bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className
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

        <div className="flex flex-col gap-1">
          <h2 className="text-theme-700 font-bold text-lg leading-tight">
            {consultant.name}
          </h2>
          <CategoryBadge category={consultant.category} size="xs" />
          
          {/* Stars */}
          {consultant.rate > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <Stars rate={consultant.rate} width={70} />
              <span className="text-sm text-gray-700 font-semibold">
                {consultant.rate.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={onBook}
        className="bg-theme hover:opacity-90 text-white shrink-0 sm:w-auto w-full"
      >
        احجز الآن
      </Button>
    </div>
  );
}