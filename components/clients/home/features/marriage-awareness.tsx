// components/clients/home/marriage-awareness-card.tsx
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import ConsultantMiniCard from "@/app/(pages)/(site)/(sub-pages)/marriage-awareness/card";
import { getConsultant } from "@/data/consultant";

export default async function MarriageAwarenessSlimCard() {
  const consultant = await getConsultant(97);
  if (!consultant) return null;

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="relative bg-white border border-blue-50 rounded-2xl shadow-lg shadow-blue-900/5 px-4 sm:px-5 py-4 sm:py-5 overflow-hidden">
        {/* background */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl" />

        {/* MAIN WRAPPER */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5 text-right">
          {/* CONTENT */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-theme/10 text-theme text-[11px] font-semibold w-fit">
              <Sparkles className="w-3 h-3" />
              مقياس الاستعداد الواعي للعلاقة والزواج
            </span>

            {/* title */}
            <h2 className="text-sm sm:text-lg font-bold text-[#094577] leading-snug">
              المقياس وتحليله مع{" "}
              <span className="text-theme">د. عبدالرحمن العازمي</span>
            </h2>

            {/* description */}
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl">
              اختبار دقيق + تحليل احترافي + جلسة استشارية لفهم التوافق قبل اتخاذ
              القرار.
            </p>

            {/* features */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] sm:text-xs text-gray-600">
              {["اختبار علمي", "تحليل مفصل", "جلسة مع مختص"].map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/marriage-awareness"
              className="inline-flex items-center gap-2 mt-2 bg-theme hover:bg-[#07365d] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all w-fit"
            >
              ابدأ الآن
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* CONSULTANT */}
          <div className="w-full sm:w-auto flex justify-center sm:justify-end shrink-0">
            <div className="sm:min-w-[220px]">
              <ConsultantMiniCard consultant={consultant} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
