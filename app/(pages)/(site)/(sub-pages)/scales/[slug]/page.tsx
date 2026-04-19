// React & Next
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// components
import { buildScaleMetadata } from "../metadata";
import ScaleAssessment from "@/components/clients/sub-pages/scales/sacle";

// prisma data
import { getAllScaleSlugs, getScaleBySlug } from "@/data/scale";

export async function generateStaticParams() {
  const slugs = await getAllScaleSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

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

export default async function ScalePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const scale = await getScaleBySlug((await params).slug);
  if (!scale) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{scale.title}</h1>
            {scale.subtitle && (
              <span className="inline-block mt-2 text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                {scale.subtitle}
              </span>
            )}
          </div>

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

          {scale.description && !scale.whoNeedsIt && (
            <p className="text-sm text-gray-600 leading-7">
              {scale.description}
            </p>
          )}
        </div>

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
