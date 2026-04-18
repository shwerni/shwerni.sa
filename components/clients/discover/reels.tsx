"use client";
// React & Next
import React from "react";

// packages
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// components
import ConsultantCard from "./card";
import ScrollTutorial from "./tutorial";

// prisma data
import { getConsultantsAvailableAt } from "@/data/reels";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/lib/utils";
import { dateToString } from "@/utils/time";
import { timeOptions } from "@/utils";

// icons
import { ArrowRight, MessageCircle } from "lucide-react";

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

export default function Reels({
  selectedDate,
  selectedTime,
  selectedGender,
  selectedCategory,
  onBack,
  onNext,
}: {
  selectedDate: Date;
  selectedTime: string;
  selectedGender: Gender | null;
  selectedCategory: Categories | null;
  onBack: () => void;
  onNext: (consultant: ReelConsultant) => void;
}) {
  // page size
  const pageSize = 5;

  // states
  const [skip, setSkip] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [consultants, setConsultants] = React.useState<ReelConsultant[]>([]);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Initial load
  React.useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setConsultants([]);
    setSkip(0);

    getConsultantsAvailableAt(
      dateToString(selectedDate),
      selectedTime,
      selectedGender,
      selectedCategory,
      0,
      pageSize,
    ).then(({ consultants: data, hasMore: more }) => {
      if (cancelled) return;
      setConsultants(data);
      setHasMore(more);
      setSkip(pageSize);
      setInitialLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, selectedDate, selectedGender, selectedTime]);

  // intersectionObserver on sentinel (second-to-last card)
  React.useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultants, hasMore, loadingMore]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const { consultants: data, hasMore: more } =
      await getConsultantsAvailableAt(
        dateToString(selectedDate),
        selectedTime,
        selectedGender,
        selectedCategory,
        skip,
        pageSize,
      );

    setConsultants((prev) => [...prev, ...data]);
    setHasMore(more);
    setSkip((s) => s + pageSize);
    setLoadingMore(false);
  }

  // track active card via scroll
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [initialLoading, consultants.length]);

  function scrollToCard(i: number) {
    scrollRef.current?.scrollTo({
      top: i * (scrollRef.current.clientHeight ?? 0),
      behavior: "smooth",
    });
  }

  return (
    <>
      {/* top bar */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowRight className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-[#094577]">
            {timeLabel(selectedTime)}
          </p>
          <p className="text-[11px] text-gray-400">
            {format(selectedDate, "EEE، d MMM", { locale: ar })}
          </p>
        </div>
        {consultants.length > 0 && (
          <div className="text-xs font-medium text-gray-400 min-w-9 text-left">
            {activeIdx + 1}/{consultants.length}
            {hasMore ? "+" : ""}
          </div>
        )}
      </div>

      {/* reel body */}
      <div className="flex-1 overflow-hidden relative">
        {/* scroll tutorial */}
        <ScrollTutorial />

        {/* initial loading */}
        {initialLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full border-4 border-[#094577]/15 border-t-[#094577] animate-spin" />
            <p className="text-sm text-gray-400">جاري البحث عن مستشارين…</p>
          </div>
        )}

        {/* empty */}
        {!initialLoading && consultants.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-red-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-lg">
                لا يوجد مستشارون متاحون
              </p>
              <p className="text-sm text-gray-400 mt-1">
                جميع المستشارين محجوزون في هذا الوقت
              </p>
            </div>
          </div>
        )}

        {/* dot rail */}
        {consultants.length > 1 && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
            {consultants.map((_, i) => (
              <div
                key={i}
                onClick={() => scrollToCard(i)}
                className={cn(
                  "w-1.75 rounded-full cursor-pointer transition-all duration-200",
                  activeIdx === i
                    ? "h-6 bg-[#094577]"
                    : "h-1.75 bg-[#094577]/20 hover:bg-[#094577]/35",
                )}
              />
            ))}
            {hasMore && (
              <div className="w-1.75 h-1.75 rounded-full bg-[#094577]/10" />
            )}
          </div>
        )}

        {/* snap scroll container */}
        {!initialLoading && consultants.length > 0 && (
          <div
            ref={scrollRef}
            className="h-full overflow-y-scroll"
            style={{
              scrollSnapType: "y mandatory",
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
            }}
          >
            {consultants.map((c, i) => {
              // attach sentinel to the second-to-last card
              const isSentinel = i === consultants.length - 2 && hasMore;
              return (
                <div
                  key={c.cid}
                  style={{ height: "100%", scrollSnapAlign: "start" }}
                >
                  <ConsultantCard
                    consultant={c}
                    onNext={onNext}
                    isActive={activeIdx === i}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    sentinelRef={isSentinel ? sentinelRef : undefined}
                  />
                </div>
              );
            })}

            {/* loading more indicator */}
            {loadingMore && (
              <div
                style={{ height: "100%", scrollSnapAlign: "start" }}
                className="flex flex-col items-center justify-center gap-3"
              >
                <div className="w-10 h-10 rounded-full border-4 border-[#094577]/15 border-t-[#094577] animate-spin" />
                <p className="text-sm text-gray-400">تحميل المزيد…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
