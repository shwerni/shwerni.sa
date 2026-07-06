"use client";
// React & Next
import { useCallback, useEffect, useState } from "react";

// utils
import { cn } from "@/lib/utils";

// icons
import { Play } from "lucide-react";

// props
type Video = {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
};

export default function ShawerniVideos({ videos }: { videos: Video[] }) {
  const [ready, setReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const idle = (cb: () => void) =>
      "requestIdleCallback" in window
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).requestIdleCallback(cb)
        : setTimeout(cb, 200);

    if (document.readyState === "complete") {
      idle(() => setReady(true));
    } else {
      const onLoad = () => idle(() => setReady(true));
      window.addEventListener("load", onLoad, { once: true });
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  const selectVideo = useCallback((index: number) => {
    setActiveIndex(index);
    setPlaying(false);
  }, []);

  const activeVideo = videos?.[activeIndex] ?? null;

  if (!ready) {
    return (
      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 lg:gap-6">
        <div className="aspect-video rounded-xl bg-white/6 animate-pulse" />
        <div className="flex gap-2.5 overflow-hidden lg:flex-col">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="shrink-0 w-28 aspect-video lg:w-full lg:h-16 rounded-lg bg-white/6 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="bg-white/4 text-white/60 text-center py-12 rounded-xl text-sm">
        لا توجد فيديوهات أو محتوى تثقيفي متاح حالياً.
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 lg:gap-6 font-ge">
      {/* Main player */}
      <div className="flex flex-col gap-2.5 min-w-0">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40 ring-1 ring-white/8">
          {playing ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo?.id}?autoplay=1&rel=0`}
              title={activeVideo?.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 w-full h-full"
              aria-label={`تشغيل ${activeVideo?.title}`}
            >
              <img
                src={activeVideo?.thumbnail}
                alt={activeVideo?.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Play className="w-4 h-4 text-[#094577] ml-0.5 fill-current" />
                </span>
              </span>
            </button>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-3 px-0.5">
          <h3 className="text-sm md:text-[15px] font-semibold text-white leading-snug line-clamp-1">
            {activeVideo?.title}
          </h3>
          <span className="shrink-0 text-[11px] text-white/40">
            {activeVideo?.date}
          </span>
        </div>
      </div>

      {/* List */}
      <div
        dir="rtl"
        className={cn(
          "flex gap-2.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]",
          "flex-row overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-0.5",
          "lg:flex-col lg:overflow-y-auto lg:max-h-75 lg:mx-0 lg:px-0 lg:pb-0 lg:snap-none",
        )}
      >
        {videos.map((video, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={video.id}
              onClick={() => selectVideo(index)}
              className={cn(
                "group relative shrink-0 snap-start text-right transition-colors duration-150",
                "w-28 sm:w-32 lg:w-full",
                "lg:flex lg:flex-row-reverse lg:items-center lg:gap-2.5 lg:rounded-lg lg:p-1.5",
                isActive ? "lg:bg-white/[0.07]" : "lg:hover:bg-white/[0.04]",
              )}
            >
              <span className="relative block w-full aspect-video lg:w-20 lg:h-11 lg:shrink-0 rounded-md overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className={cn(
                    "w-full h-full object-cover transition-opacity",
                    isActive
                      ? "opacity-100"
                      : "opacity-70 group-hover:opacity-100",
                  )}
                />
                {isActive && (
                  <>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <Play className="w-2 h-2 text-[#094577] fill-current" />
                      </span>
                    </span>
                    <span className="absolute inset-y-0 right-0 w-0.75 bg-white/90 hidden lg:block" />
                  </>
                )}
              </span>

              <span className="block lg:hidden! mt-1.5 text-[11px] leading-snug text-white/70 line-clamp-2">
                {video.title}
              </span>

              {!isActive && (
                <span className="hidden lg:block flex-1 text-[12.5px] font-medium leading-snug line-clamp-2 text-white/55 group-hover:text-white/80">
                  {video.title}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
