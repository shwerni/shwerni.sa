import { cacheTag } from "next/cache";
import { getConsultantCost } from "./consultant";
import prisma from "@/lib/database/db";
import { Placement } from "@/lib/generated/prisma/enums";
import { timeZone } from "@/lib/site/time";
import { applyRule } from "@/utils/event";

// data/pricing.ts
export type Costs = Record<30 | 45 | 60, number>;

export type PricingResult = {
  cost: Costs;
  original: Costs;
  discount: { did: number; label: string } | null;
};

export type ResolvedPrice = PricingResult | null;

export const resolveConsultantPricing = async (
  cid: number,
): Promise<ResolvedPrice> => {
  const base = await getConsultantCost(cid);
  if (!base) return null;

  const rule = await getActiveDiscountFor(cid);
  if (!rule) return { cost: base, original: base, discount: null };

  const cost: Costs = { ...base };
  for (const d of rule.durations as (30 | 45 | 60)[]) {
    cost[d] = applyRule(base[d], rule);
  }

  return {
    cost,
    original: base,
    discount: { did: rule.did, label: rule.name },
  };
};

// data/events.ts
export const getCampaignFor = async (placement: Placement) => {
  "use cache";
  cacheTag("event-campaigns");
  return prisma.eventCampaign.findFirst({
    where: {
      active: true,
      placements: { has: placement },
      OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }],
    },
    orderBy: { priority: "desc" },
    include: { discount: true },
  });
};

// data/discounts.ts
export const getActiveDiscountFor = async (cid: number) => {
  try {
    const { iso: now } = timeZone();

    const link = await prisma.discountConsultant.findFirst({
      where: {
        consultantId: cid,
        status: true,
        discount: {
          status: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
      include: { discount: true },
      orderBy: { discountId: "desc" },
    });

    return link?.discount ?? null;
  } catch {
    return null;
  }
};
