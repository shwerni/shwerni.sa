// React & Next
import Image from "next/image";

// components
import Videos from "./videos";

// data
import { getYouTubeVideos } from "@/lib/api/google";

// icons
import { ArrowLeft } from "lucide-react";

const Podcast = async () => {
  // get videos
  const liveVideos = await getYouTubeVideos(10);

  return (
    <section className="relative bg-[#052A47] py-12 md:py-16 px-4 mb-5 overflow-hidden">
      <Image
        src="/layout/logo-sm.png"
        alt=""
        width={420}
        height={420}
        aria-hidden="true"
        className="pointer-events-none select-none absolute bottom-3 left-3 w-65 md:w-95 opacity-[0.07]"
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-row items-center justify-between gap-3 mb-6 md:mb-8">
          <div>
            <span className="block text-white/50 font-medium text-xs mb-1 tracking-wide">
              المحتوى التعليمي
            </span>
            <h2 className="text-white font-bold text-2xl md:text-3xl tracking-tight font-ge">
              الفيديوهات
            </h2>
          </div>

          <a
            href="https://www.youtube.com/channel/UCJoXLYlwmcAgYdlIU1p-tNw"
            className="group flex items-center gap-1.5 shrink-0 text-white/70 hover:text-white text-sm font-ge transition-colors"
          >
            عرض كل الفيديوهات
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </a>
        </div>

        <Videos videos={liveVideos} />
      </div>
    </section>
  );
};

export default Podcast;
