"use client";
// React & Next
import React from "react";

// components
import StarBadge from "../shared/star-badge";
import { Button } from "@/components/ui/button";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// utils
import { cn } from "@/lib/utils";
import { findCategory, timeOptions } from "@/utils";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";

// icons
import { Briefcase, ChevronLeft, Clock, Star } from "lucide-react";

type ReelConsultant = {
  cid: number;
  name: string;
  title: string;
  nabout: string;
  gender: Gender;
  category: Categories;
  image: string | null;
  rate: number;
  cost30: number;
  cost45: number;
  cost60: number;
  years: number;
  review_count: number;
};

function timeLabel(value: string): string {
  return timeOptions.find((o) => o.value === value)?.label ?? value;
}

export default function ConsultantCard({
  consultant,
  isActive,
  selectedTime,
  sentinelRef,
  onNext,
}: {
  consultant: ReelConsultant;
  isActive: boolean;
  selectedDate: Date;
  selectedTime: string;
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
  onNext: (consultant: ReelConsultant) => void;
}) {
  return (
    <div
      ref={sentinelRef}
      className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden"
      style={{ scrollSnapAlign: "start", flexShrink: 0 }}
    >
      {/* background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg,#e8f1fb 0%,#f3f7fd 45%,#ffffff 100%)",
        }}
      />

      {/* glow */}
      <div
        className="absolute"
        style={{
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(9,69,119,.09) 0%,transparent 70%)",
        }}
      />

      {/* avatar & rate - DECREASED GAP */}
      <div className="flex flex-col items-center gap-1.5 py-5 z-10">
        {/* avatar */}
        <div
          className={cn(
            "w-28 h-28 rounded-full overflow-hidden",
            "border-4 border-white shadow-md",
            "transition-all duration-500",
            isActive ? "scale-100 opacity-100" : "scale-95 opacity-70",
          )}
        >
          <ConsultantImage
            name={consultant.name}
            image={consultant.image}
            gender={consultant.gender}
            className="w-full h-full object-cover"
          />
        </div>

        {/* star badge - MOVED UP SLIGHTLY */}
        {consultant.rate > 0 && (
          <StarBadge
            rate={consultant.rate}
            variant="white"
            className="shadow-sm"
          />
        )}
      </div>

      {/* content panel - MADE HIGHER WITH NEGATIVE MARGIN */}
      <div
        className={cn(
          "relative w-full bg-white rounded-t-[32px] flex-1",
          "shadow-[0_-8px_40px_rgba(9,69,119,0.12)]",
          "flex flex-col gap-4 px-5 pt-7 pb-8 -mt-6", // Negative margin pulls it up
          "transition-transform duration-500",
          isActive ? "translate-y-0" : "translate-y-4",
        )}
        style={{ minHeight: "65%" }} // Ensures the main body is higher
      >
        {/* name & title & category */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#094577]">
            {consultant.name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{consultant.title}</p>
          <span
            className={cn(
              "mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-semibold",
              findCategory(consultant.category)?.style,
            )}
          >
            {findCategory(consultant.category)?.label}
          </span>
        </div>

        {/* stats */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#094577]/40" />
            <span>
              {consultant.years}{" "}
              {consultant.years === 1 ? "سنة خبرة" : "سنوات خبرة"}
            </span>
          </div>
          {consultant.review_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#094577]/40" />
              <span>{consultant.review_count} تقييم</span>
            </div>
          )}
        </div>

        {/* bio */}
        {consultant.nabout && (
          <p className="text-sm text-gray-600 leading-relaxed text-right flex-1 line-clamp-3">
            {consultant.nabout}
          </p>
        )}

        {/* cost chips */}
        <div className="flex flex-wrap gap-2 justify-center mt-auto">
          {(
            [
              { label: "30 دقيقة", value: consultant.cost30 },
              { label: "60 دقيقة", value: consultant.cost60 },
            ] as const
          ).map(({ label, value }) =>
            value > 0 ? (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 bg-gray-50/50 text-xs text-gray-700"
              >
                <Clock className="w-3 h-3 text-[#094577]/40" />
                <span>{label}</span>
                <span className="font-bold text-[#094577]">{value} ر.س</span>
              </div>
            ) : null,
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={() => onNext(consultant)}
          variant="primary"
          className="gap-2 w-full py-6 rounded-2xl text-sm font-bold hover:bg-[#0a5291] active:scale-[0.98] transition-all"
        >
          احجز الآن – {timeLabel(selectedTime)}
          <ChevronLeft className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
