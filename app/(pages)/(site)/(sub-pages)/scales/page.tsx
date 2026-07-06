import { getAllScales } from "@/data/scales";
import type { Metadata } from "next";
import Link from "next/link";
import { scalesListMetadata } from "./metadata";
import { getScaleVisuals } from "./scale-visuals";

export const metadata: Metadata = scalesListMetadata;

export default async function MaqayesPage() {
  const scales = await getAllScales();
  const visuals = getScaleVisuals(scales);

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            المقاييس النفسية والأسرية
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            أدوات تقييم موثوقة تساعدك على فهم نفسك ومشاعرك بشكل أعمق. أجب على
            الأسئلة واكتشف نتيجتك فوراً ومجاناً.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        {scales.length === 0 ? (
          <p className="text-center text-gray-400 py-20">
            لا توجد مقاييس متاحة حالياً.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {scales.map((scale) => {
              const visual = visuals.get(scale.id)!;
              const Icon = visual.icon;

              return (
                <Link
                  key={scale.id}
                  href={`/scales/${scale.slug}`}
                  className={`group rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${visual.bg} ${visual.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl ${visual.iconBg} flex items-center justify-center mb-4`}
                      >
                        <Icon className={`w-5 h-5 ${visual.iconColor}`} />
                      </div>

                      {/* Title block */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-snug">
                          {scale.title}
                        </h2>
                        {scale.subtitle && (
                          <span className="inline-block text-[11px] font-semibold text-white px-2 py-0.5 rounded-full bg-[#094577]">
                            {scale.subtitle}
                          </span>
                        )}
                      </div>
                      <span
                        className="block w-8 h-[3px] rounded-full mt-2"
                        style={{ backgroundColor: visual.accent }}
                      />

                      {scale.description && (
                        <p className="mt-3 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {scale.description}
                        </p>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-white/70 group-hover:bg-[#094577] flex items-center justify-center transition-colors">
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-white rotate-180 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center gap-2">
                    <span className="text-xs font-medium text-[#094577]">
                      ابدأ المقياس ←
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
          <strong>تنبيه: </strong>
          هذه المقاييس للتوعية والإرشاد فقط، ولا تُغني عن تشخيص أو علاج متخصص.
          إذا كنت تعاني من أعراض نفسية، يُنصح بمراجعة مختص.
        </div>
      </div>
    </main>
  );
}