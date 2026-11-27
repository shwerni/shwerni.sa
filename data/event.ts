import { getConsultantCost } from "./consultant";
import prisma from "@/lib/database/db";
import { Placement } from "@/lib/generated/prisma/enums";
import { timeZone } from "@/utils/date";
import { applyRule } from "@/utils/event";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";

// data/pricing.ts
// prices by length in minutes ("30" → price)
type Costs = Record<string, number>;

type PricingResult = {
  // the consultant's effective single-session lengths (what the booking forms offer)
  durations: number[];
  // the priced lengths, the campaign applied
  cost: Costs;
  // the priced lengths before the campaign
  original: Costs;
  // the campaign, with only the priced lengths it covers; null when it covers none of them
  discount: { did: number; label: string; durations: number[] } | null;
};

type ResolvedPrice = PricingResult | null;

/**
 * a consultant's prices: their effective lengths, plus `also` (fixed products and the length a quote
 * prices, so step 3 refuses nothing: instant at 30, the package's 45, a requested length), each only
 * when it has a price. the campaign applies to the lengths it covers among those
 * @param also lengths to price besides the effective ones (never added to `durations`)
 */
export const resolveConsultantPricing = async (
  cid: number,
  also: readonly number[] = [],
): Promise<ResolvedPrice> => {
  const base = await getConsultantCost(cid);
  if (!base) return null;

  const priced = [...new Set([...base.durations, ...also])]
    .filter((minutes) => typeof base.costs[String(minutes)] === "number")
    .sort((a, b) => a - b);

  const original: Costs = {};
  for (const minutes of priced) original[String(minutes)] = base.costs[String(minutes)];

  const rule = await getActiveDiscountFor(cid);
  const covered = rule ? priced.filter((minutes) => rule.durations.includes(minutes)) : [];
  if (!rule || covered.length === 0)
    return { durations: base.durations, cost: { ...original }, original, discount: null };

  const cost: Costs = { ...original };
  for (const minutes of covered) {
    cost[String(minutes)] = applyRule(original[String(minutes)], rule);
  }

  return {
    durations: base.durations,
    cost,
    original,
    discount: { did: rule.did, label: rule.name, durations: covered },
  };
};

// data/events.ts
export const getCampaignFor = async (placement: Placement) => {
  "use cache";
  cacheTag("event-campaigns");
  cacheLife("hours");

  return prisma.eventCampaign.findFirst({
    where: {
      active: true,
      placements: { has: placement },
      // no date filter here — see note below
    },
    orderBy: { priority: "desc" },
    include: { discount: true },
  });
};

// data/discounts.ts
const getActiveDiscountFor = async (cid: number) => {
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
        // centers spec §8: discount.centerId must equal the consultant's centerId (null matches null)
        OR: [
          { consultant: { centerId: null }, discount: { centerId: null } },
          { discount: { center: { is: { consultants: { some: { cid } } } } } },
        ],
      },
      include: { discount: true },
      orderBy: { discountId: "desc" },
    });

    return link?.discount ?? null;
  } catch {
    return null;
  }
};

export const getActiveCampaignFor = async (placement: Placement) => {
  const campaign = await getCampaignFor(placement); // cached — fine at build time
  if (!campaign) return null;

  // opt this part out of static prerender
  await connection();
  const now = Date.now();

  const started = !campaign.startDate || campaign.startDate.getTime() <= now;
  const notEnded = !campaign.endDate || campaign.endDate.getTime() >= now;

  return started && notEnded ? campaign : null;
};
