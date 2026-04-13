import { getAllScaleSlugs, getScaleBySlug } from "@/data/scale";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildScaleMetadata } from "../metadata";
import ScaleAssessment from "@/components/clients/scale";

// ── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = await getAllScaleSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const scale = await getScaleBySlug((await params).slug);
  if (!scale) return {};
  return buildScaleMetadata({
    title: scale.title,
    subtitle: scale.subtitle,
    description: scale.description,
    slug: scale.slug,
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ScalePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const scale = await getScaleBySlug((await params).slug);
  if (!scale) notFound();

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* ── Title card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{scale.title}</h1>
            {scale.subtitle && (
              <span className="inline-block mt-2 text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                {scale.subtitle}
              </span>
            )}
          </div>

          {/* من يحتاجه */}
          {scale.whoNeedsIt && (
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-800 mb-2">
                من يناسبه هذا المقياس؟
              </h2>
              <div className="text-sm text-gray-600 leading-7 whitespace-pre-line">
                {scale.whoNeedsIt}
              </div>
            </div>
          )}

          {/* كيف يتم العمل */}
          {scale.howItWorks && (
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-800 mb-2">
                كيف يتم عمل المقياس؟
              </h2>
              <div className="text-sm text-gray-600 leading-7 whitespace-pre-line">
                {scale.howItWorks}
              </div>
            </div>
          )}

          {/* Description */}
          {scale.description && !scale.whoNeedsIt && (
            <p className="text-sm text-gray-600 leading-7">
              {scale.description}
            </p>
          )}
        </div>

        {/* ── Interactive assessment ──────────────────────────────── */}
        <ScaleAssessment
          scaleSlug={scale.slug}
          scaleTitle={scale.title}
          items={scale.items}
          resultRanges={scale.resultRanges}
        />
      </div>
    </main>
  );
}
