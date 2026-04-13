import prisma from "@/lib/database/db";
import { AnswerOption, Scale, ScaleItem, ScaleResultRange } from "@/lib/generated/prisma/client";

// ── Types ───────────────────────────────────────────────────────────────────

export type ScaleWithItems = Scale & {
  items: (ScaleItem & { options: AnswerOption[] })[];
  resultRanges: ScaleResultRange[];
};

export type ScaleSummary = Pick<
  Scale,
  "id" | "slug" | "title" | "subtitle" | "description" | "whoNeedsIt"
>;

// ── Queries ─────────────────────────────────────────────────────────────────

/** All active scales for the listing page */
export async function getAllScales(): Promise<ScaleSummary[]> {
  return prisma.scale.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      whoNeedsIt: true,
    },
  });
}

/** Single scale with all items + options + result ranges */
export async function getScaleBySlug(slug: string): Promise<ScaleWithItems | null> {
  return prisma.scale.findUnique({
    where: { slug, isActive: true },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
        },
      },
      resultRanges: { orderBy: { minScore: "asc" } },
    },
  });
}

/** All active scale slugs — used for generateStaticParams */
export async function getAllScaleSlugs(): Promise<{ slug: string }[]> {
  return prisma.scale.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
}

// ── Score helper (pure — no DB needed) ─────────────────────────────────────

export function resolveResultRange(
  score: number,
  ranges: ScaleResultRange[]
): ScaleResultRange | undefined {
  return ranges.find((r) => score >= r.minScore && score <= r.maxScore);
}

export function maxPossibleScore(items: ScaleItem[], options: AnswerOption[]): number {
  // Max value per item × number of items
  const maxPerItem = Math.max(...options.map((o) => o.value));
  return items.length * maxPerItem;
}