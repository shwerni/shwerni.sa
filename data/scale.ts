"use server";
import {
  ScaleAnswerOption,
  Scale,
  ScaleItem,
  ScaleResultRange,
} from "@/lib/generated/prisma/client";
import prisma from "@/lib/database/db";
import { notificationScaleReminder } from "@/lib/notifications";

type ScaleWithItems = Scale & {
  items: (ScaleItem & { options: ScaleAnswerOption[] })[];
  resultRanges: ScaleResultRange[];
};

type ScaleSummary = Pick<
  Scale,
  "id" | "slug" | "title" | "subtitle" | "description" | "whoNeedsIt"
>;

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

export async function getScaleBySlug(
  slug: string,
): Promise<ScaleWithItems | null> {
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

export async function getAllScaleSlugs(): Promise<{ slug: string }[]> {
  return prisma.scale.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
}

export type OrderScaleFullReport = Awaited<
  ReturnType<typeof getOrderScaleFullReport>
>;

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function getOrderScaleFullReport(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { oid: orderId },
    select: {
      id: true,
      name: true,
      scaleId: true,

      // Scale meta
      scale: {
        select: {
          id: true,
          title: true,
          slug: true,
          resultRanges: {
            select: {
              id: true,
              label: true,
              minScore: true,
              maxScore: true,
              description: true,
              severity: true,
            },
          },
        },
      },

      // Aggregate result (score + range)
      scaleResult: {
        select: {
          id: true,
          score: true,
          createdAt: true,
        },
      },

      // Per-question responses — ordered by question position
      scaleResponses: {
        orderBy: { item: { order: "asc" } },
        select: {
          id: true,
          value: true,
          item: {
            select: {
              id: true,
              text: true,
              order: true,
              reversed: true,
              options: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  label: true,
                  value: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  // ── Derived values ────────────────────────────────────────────────────────

  const hasScale = !!order.scaleId;
  const hasTakenTest = !!order.scaleResult;
  const score = order.scaleResult?.score ?? null;

  // Max possible score across all answered items
  const maxScore = order.scaleResponses.reduce((sum, r) => {
    const max = Math.max(...r.item.options.map((o) => o.value));
    return sum + max;
  }, 0);

  // Match score to a result range
  const matchedRange =
    score !== null
      ? (order.scale?.resultRanges.find(
          (r) => score >= r.minScore && score <= r.maxScore,
        ) ?? null)
      : null;

  // Shape per-question detail
  const responses = order.scaleResponses.map((r) => ({
    questionNumber: r.item.order,
    questionText: r.item.text,
    reversed: r.item.reversed,
    chosenValue: r.value,
    chosenOption: r.item.options.find((o) => o.value === r.value) ?? null,
    allOptions: r.item.options,
  }));

  return {
    orderId: order.id,
    orderName: order.name,
    hasScale,
    hasTakenTest,
    scale: order.scale ?? null,
    score,
    maxScore,
    matchedRange,
    completedAt: order.scaleResult?.createdAt ?? null,
    responses,
  };
}

export async function getOrderWithScaleByOid(oid: number) {
  return prisma.order.findUnique({
    where: { oid },
    select: {
      id: true,
      oid: true,
      name: true,
      scaleId: true,

      // Just check if result already exists
      scaleResult: {
        select: { id: true },
      },

      scale: {
        select: {
          id: true,
          title: true,
          slug: true,
          subtitle: true,
          items: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              order: true,
              reversed: true,
              options: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  label: true,
                  value: true,
                  order: true,
                },
              },
            },
          },
          resultRanges: {
            select: {
              id: true,
              label: true,
              minScore: true,
              maxScore: true,
              description: true,
              severity: true,
            },
          },
        },
      },
    },
  });
}

interface ScaleResponse {
  itemId: string;
  value: number;
}

interface SubmitScaleResultInput {
  orderId: number;
  scaleId: string;
  score: number;
  responses: ScaleResponse[];
}

export async function submitScaleResult({
  orderId,
  scaleId,
  score,
  responses,
}: SubmitScaleResultInput): Promise<{ success: boolean; error?: string }> {
  try {
    // exist
    const existing = await prisma.scaleResult.findUnique({
      where: { orderId: orderId },
      select: { id: true },
    });

    // validate
    if (existing) return { success: true };

    // get order
    const order = await prisma.order.findUnique({
      where: { oid: orderId },
      select: {
        name: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // validate
    if (!order) return { success: false, error: "الطلب غير موجود." };

    await prisma.$transaction([
      prisma.scaleResult.create({
        data: { orderId, scaleId, score },
      }),
      prisma.scaleResponse.createMany({
        data: responses.map((r) => ({
          orderId,
          itemId: r.itemId,
          value: r.value,
        })),
        skipDuplicates: true,
      }),
    ]);

    // notify
    await notificationScaleReminder(
      orderId,
      order.consultant.phone,
      order.name,
      order.consultant.name,
    );
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حفظ النتائج." };
  }
}
