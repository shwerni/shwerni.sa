"use client";
// React & Next
import React from "react";

// components
import StarBadge from "../shared/star-badge";
import { LinkButton } from "@/components/shared/link-button";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// utils
import { cn } from "@/lib/utils";
import { findCategory, timeOptions } from "@/utils";
import { dateToString } from "@/utils/time";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";

// icons
import { Briefcase, ChevronLeft, Clock, MessageCircle } from "lucide-react";

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
  selectedDate,
  selectedTime,
  sentinelRef,
}: {
  consultant: ReelConsultant;
  isActive: boolean;
  selectedDate: Date;
  selectedTime: string;
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const params = new URLSearchParams({
    date: dateToString(selectedDate),
    time: selectedTime,
  });

  return (
    <div
      ref={sentinelRef}
      className="relative w-full h-full flex flex-col items-center justify-between"
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
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(9,69,119,.09) 0%,transparent 70%)",
        }}
      />
      
      {/* avatar & rate */}
      <div className="flex flex-col items-center gap-5 pt-14">
        {/* avatar */}
        <div
          className={cn(
            "w-28 h-28 rounded-full overflow-hidden",
            "border-4 border-white shadow-lg",
            "transition-all duration-500",
            isActive ? "scale-100 opacity-100" : "scale-95 opacity-70",
          )}
          style={{ top: 44 }}
        >
          <ConsultantImage
            name={consultant.name}
            image={consultant.image}
            gender={consultant.gender}
            className="w-full h-full object-cover"
          />
        </div>

        {/* star */}
        {consultant.rate > 0 && (
          <StarBadge
            rate={consultant.rate}
            variant="white"
            className="shadow-sm z-10"
          />
        )}
      </div>

      {/* content panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-t-[28px]",
          "shadow-[0_-6px_30px_rgba(9,69,119,0.08)]",
          "flex flex-col gap-4 px-5 pt-6 pb-8",
          "transition-transform duration-500",
          isActive ? "translate-y-0" : "translate-y-2",
        )}
        style={{ maxHeight: "75vh", overflowY: "auto" }}
      >
        {/* name & title & category */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#094577]">
            {consultant.name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{consultant.title}</p>
          <span
            className={cn(
              "mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-semibold",
              findCategory(consultant.category)?.style,
            )}
          >
            {findCategory(consultant.category)?.label}
          </span>
        </div>

        {/* stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-[#094577]/40" />
            <span>
              {consultant.years}{" "}
              {consultant.years === 1 ? "سنة خبرة" : "سنوات خبرة"}
            </span>
          </div>
          {consultant.review_count > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#094577]/40" />
              <span>{consultant.review_count} تقييم</span>
            </div>
          )}
        </div>

        {/* bio */}
        {consultant.nabout && (
          <p className="text-sm text-gray-600 leading-relaxed text-right line-clamp-4">
            {consultant.nabout}
          </p>
        )}

        {/* cost chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {(
            [
              { label: "30 دقيقة", value: consultant.cost30 },
              { label: "60 دقيقة", value: consultant.cost60 },
            ] as const
          ).map(({ label, value }) =>
            value > 0 ? (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700"
              >
                <Clock className="w-3 h-3 text-[#094577]/40" />
                <span>{label}</span>
                <span className="font-bold text-[#094577]">{value} ر.س</span>
              </div>
            ) : null,
          )}
        </div>

        {/* CTA */}
        <LinkButton
          href={`/consultants/${consultant.cid}?${params.toString()}`}
          variant="primary"
          className="gap-2 w-full py-3.5 rounded-2xltext-sm font-semibold hover:bg-[#0a5291] active:scale-[0.98] transition-all duration-150"
        >
          احجز الآن – {timeLabel(selectedTime)}
          <ChevronLeft className="w-4 h-4" />
        </LinkButton>
      </div>
    </div>
  );
}
