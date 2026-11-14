// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// prisma data
import { getScaleBySlug } from "@/data/scales";

// prisma types
import { ScaleState, ScaleType } from "@/lib/generated/prisma/enums";

interface ScaleDetails {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  description: string | null;
  whoNeedsIt: string | null;
  howItWorks: string | null;
  items: { id: string; text: string; options: { id: string; label: string; value: number }[] }[];
  ranges: {
    id: string;
    label: string;
    minScore: number;
    maxScore: number;
    description: string | null;
    severity: string | null;
  }[];
}

// a published, public, active scale with its questions and ranges (private scales belong to scale
// orders); nothing is stored: the app counts the score like the website's ScaleAssessment
export const GET = createGetRoute<ScaleDetails, { slug: string }>(async (request, { params }) => {
  await requireMobileUser(request);
  const { slug } = await params;
  if (!slug || slug.length > 200) throw new HttpError("المقياس غير موجود", 404);

  const scale = await getScaleBySlug(slug);
  if (!scale || scale.status !== ScaleState.PUBLISHED || scale.type !== ScaleType.PUBLIC) {
    throw new HttpError("المقياس غير موجود", 404);
  }

  return {
    id: scale.id,
    slug: scale.slug,
    title: scale.title,
    subtitle: scale.subtitle,
    image: scale.image,
    description: scale.description,
    whoNeedsIt: scale.whoNeedsIt,
    howItWorks: scale.howItWorks,
    items: scale.items.map((item) => ({
      id: item.id,
      text: item.text,
      options: item.options.map((o) => ({ id: o.id, label: o.label, value: o.value })),
    })),
    ranges: scale.resultRanges.map((r) => ({
      id: r.id,
      label: r.label,
      minScore: r.minScore,
      maxScore: r.maxScore,
      description: r.description,
      severity: r.severity,
    })),
  };
});
