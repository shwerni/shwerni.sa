"use client";
import React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ConsultantCard from "./card";
import ScrollTutorial from "./tutorial";
import { getConsultantsAvailableAt } from "@/data/reels";
import { Categories, Gender } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { timeOptions } from "@/utils";
import { dateToString } from "@/utils/time";
import { ArrowRight, User2 } from "lucide-react";

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

// ✅ stable — defined once at module level, never re-created
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
  const pageSize = 5;

  const [skip, setSkip] = React.useState(0);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [consultants, setConsultants] = React.useState<ReelConsultant[]>([]);
  const [cardHeight, setCardHeight] = React.useState(0);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const dotRailRef = React.useRef<HTMLDivElement>(null);

  // ✅ keep a ref for skip so loadMore always reads the latest value
  //    without needing skip in its dependency array
  const skipRef = React.useRef(0);
  const hasMoreRef = React.useRef(false);
  const loadingMoreRef = React.useRef(false);

  // keep refs in sync
  React.useEffect(() => {
    skipRef.current = skip;
    hasMoreRef.current = hasMore;
    loadingMoreRef.current = loadingMore;
  }, [skip, hasMore, loadingMore]);

  // dot rail scroll — scoped, never touches card container
  React.useEffect(() => {
    const rail = dotRailRef.current;
    if (!rail) return;
    const activeDot = rail.children[activeIdx] as HTMLElement;
    if (!activeDot) return;
    const railCenter = rail.offsetHeight / 2;
    const dotCenter = activeDot.offsetTop + activeDot.offsetHeight / 2;
    rail.scrollTo({ top: dotCenter - railCenter, behavior: "smooth" });
  }, [activeIdx]);

  // measure scroll container height once (and on resize)
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setCardHeight(entry.contentRect.height);
    });
    ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  // initial + filter load
  React.useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setConsultants([]);
    setSkip(0);
    setActiveIdx(0);

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

  // ✅ useCallback — stable reference, safe for effect deps
  const loadMore = React.useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;

    // ✅ set ref synchronously — blocks re-entry before state catches up
    loadingMoreRef.current = true;
    setLoadingMore(true);

    const { consultants: data, hasMore: more } =
      await getConsultantsAvailableAt(
        dateToString(selectedDate),
        selectedTime,
        selectedGender,
        selectedCategory,
        skipRef.current,
        pageSize,
      );

    setConsultants((prev) => {
      const existingIds = new Set(prev.map((c) => c.cid));
      const fresh = data.filter((c) => !existingIds.has(c.cid));
      return [...prev, ...fresh];
    });

    setHasMore(more);
    setSkip((s) => s + pageSize);
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [selectedCategory, selectedDate, selectedGender, selectedTime]);

  // sentinel observer
  React.useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { threshold: 0.3 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [consultants, hasMore, loadingMore, loadMore]);

  // ✅ track active card — runs once, reads clientHeight live from the element
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [initialLoading]);

  // ✅ useCallback — stable, dot onClick handlers won't re-create on each render
  const scrollToCard = React.useCallback((i: number) => {
    scrollRef.current?.scrollTo({
      top: i * (scrollRef.current.clientHeight ?? 0),
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* top bar */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-30">
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
      <div className="flex-1 min-h-0 overflow-hidden relative bg-gray-50">
        <ScrollTutorial />

        {initialLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full border-4 border-[#094577]/15 border-t-[#094577] animate-spin" />
            <p className="text-sm text-gray-400">جاري البحث عن مستشارين…</p>
          </div>
        )}

        {!initialLoading && consultants.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <User2 className="w-8 h-8 text-red-300" />
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

        {consultants.length > 1 && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col z-10">
            <div
              ref={dotRailRef}
              className="flex flex-col gap-1.5 max-h-[35vh] overflow-y-auto py-3 items-center [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {consultants.map((_, i) => (
                <DotItem // ✅ extracted — prevents all dots re-rendering on activeIdx change
                  key={i}
                  index={i}
                  active={activeIdx === i}
                  onClick={scrollToCard}
                />
              ))}
              {hasMore && (
                <div className="w-1.75 h-1.75 rounded-full bg-[#094577]/10 shrink-0" />
              )}
            </div>
          </div>
        )}

        {!initialLoading && consultants.length > 0 && (
          <div
            ref={scrollRef}
            className="h-full overflow-y-scroll"
            style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
          >
            {consultants.map((c, i) => {
              const isSentinel = i === consultants.length - 2 && hasMore;
              return (
                <div
                  key={c.cid}
                  style={{
                    scrollSnapAlign: "start",
                    height: cardHeight > 0 ? `${cardHeight}px` : "100%",
                    flexShrink: 0,
                  }}
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
          </div>
        )}

        {loadingMore && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-200 rounded-full px-5 py-2.5 flex items-center gap-3 transition-all">
            <div className="w-4 h-4 rounded-full border-2 border-[#094577]/20 border-t-[#094577] animate-spin" />
            <p className="text-xs font-semibold text-[#094577]">
              تحميل المزيد…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ memoized dot — only re-renders when its own active state changes
const DotItem = React.memo(function DotItem({
  index,
  active,
  onClick,
}: {
  index: number;
  active: boolean;
  onClick: (i: number) => void;
}) {
  return (
    <div
      onClick={() => onClick(index)}
      className={cn(
        "w-1.75 rounded-full cursor-pointer transition-all duration-200 shrink-0",
        active
          ? "h-6 bg-[#094577]"
          : "h-1.75 bg-[#094577]/20 hover:bg-[#094577]/35",
      )}
    />
  );
});
