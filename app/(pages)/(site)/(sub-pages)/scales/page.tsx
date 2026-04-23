import { getAllScales } from "@/data/scales";
import type { Metadata } from "next";
import Link from "next/link";
import { scalesListMetadata } from "./metadata";

export const metadata: Metadata = scalesListMetadata;

export default async function MaqayesPage() {
  const scales = await getAllScales();

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">المقاييس النفسية والأسرية</h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            أدوات تقييم موثوقة تساعدك على فهم نفسك ومشاعرك بشكل أعمق.
            أجب على الأسئلة واكتشف نتيجتك فوراً ومجاناً.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        {scales.length === 0 ? (
          <p className="text-center text-gray-400 py-20">لا توجد مقاييس متاحة حالياً.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {scales.map((scale) => (
              <Link
                key={scale.id}
                href={`/مقاييس/${scale.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {scale.title}
                    </h2>
                    {scale.subtitle && (
                      <span className="inline-block mt-1 text-xs font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        {scale.subtitle}
                      </span>
                    )}
                    {scale.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {scale.description}
                      </p>
                    )}
                  </div>
                  {/* Arrow */}
                  <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-white rotate-180 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <span className="text-xs text-blue-600 font-medium">ابدأ المقياس ←</span>
                </div>
              </Link>
            ))}
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