import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import type { DiscountType } from "@/lib/generated/prisma/enums";

// data
import { getConsultantCost } from "@/data/consultant";
import { resolveConsultantPricing } from "@/data/event";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// utils
import { timeZone } from "@/utils/date";
import { applyRule } from "@/utils/event";
import { calculateDues } from "@/utils/admin/dues";

const DURATIONS = [30, 45, 60] as const;

// GET /api/mobile/owner/discounts -> discounts[]
export interface OwnerDiscount {
  did: number;
  name: string;
  image: string | null;
  type: DiscountType;
  discount: number;
  startDate: string;
  endDate: string;
  joined: boolean;
}

// GET /api/mobile/owner/discounts/{did}
export interface OwnerDiscountDetails {
  discount: OwnerDiscount & { description: string; running: boolean; applied: boolean };
  prices: {
    duration: (typeof DURATIONS)[number];
    covered: boolean;
    price: number;
    final: number;
    earning: number;
  }[];
}

// the public campaign fields: never users, limit, maxUses, usedCount, overrides or visibility
const discountSelect = {
  did: true,
  name: true,
  image: true,
  type: true,
  discount: true,
  startDate: true,
  endDate: true,
} as const;

/**
 * the platform's campaigns, newest first, with whether this consultant joined each: the website's
 * getActiveDiscounts (status true, no date filter) for platform campaigns only (centerId null; a
 * center campaign never applies to a platform consultant)
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerDiscounts = async (cid: number): Promise<OwnerDiscount[]> => {
  const [discounts, links] = await Promise.all([
    prisma.discount.findMany({
      where: { status: true, centerId: null },
      select: discountSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.discountConsultant.findMany({
      where: { consultantId: cid },
      select: { discountId: true, status: true },
    }),
  ]);

  const joined = new Map(links.map((link) => [link.discountId, link.status]));

  return discounts.map((discount) => ({
    did: discount.did,
    name: discount.name,
    image: discount.image,
    type: discount.type,
    discount: discount.discount,
    startDate: discount.startDate.toISOString(),
    endDate: discount.endDate.toISOString(),
    joined: joined.get(discount.did) ?? false,
  }));
};

/**
 * one platform campaign for this consultant, with every number computed on the server: the
 * consultant's own price per length, the campaign's price (applyRule, only for the lengths it
 * covers) and the consultant's earning on it (calculateDues with the commission a booking would
 * use: the consultant's own, else the platform default, as reserveConsultant / reserveInstant).
 * running and applied read "now" like the site's pricing (resolveConsultantPricing). null for a
 * missing, hidden or center campaign
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param did the campaign id from the url
 */
export const getOwnerDiscount = async (
  cid: number,
  did: number,
): Promise<OwnerDiscountDetails | null> => {
  const [discount, link, consultant] = await Promise.all([
    prisma.discount.findUnique({
      where: { did },
      select: {
        ...discountSelect,
        description: true,
        status: true,
        centerId: true,
        durations: true,
      },
    }),
    prisma.discountConsultant.findUnique({
      where: { consultantId_discountId: { consultantId: cid, discountId: did } },
      select: { status: true },
    }),
    prisma.consultant.findUnique({ where: { cid }, select: { commission: true } }),
  ]);
  if (!discount || !discount.status || discount.centerId !== null) return null;

  const [cost, pricing, finance] = await Promise.all([
    getConsultantCost(cid),
    resolveConsultantPricing(cid),
    consultant?.commission ? null : getFinanceConfig(),
  ]);
  const commission = consultant?.commission || finance?.commission;
  if (!cost || !commission) throw new Error("consultant price or commission unavailable");

  const { iso: now } = timeZone();

  return {
    discount: {
      did: discount.did,
      name: discount.name,
      image: discount.image,
      type: discount.type,
      discount: discount.discount,
      startDate: discount.startDate.toISOString(),
      endDate: discount.endDate.toISOString(),
      joined: link?.status ?? false,
      description: discount.description,
      running: discount.startDate <= now && now <= discount.endDate,
      applied: pricing?.discount?.did === did,
    },
    prices: DURATIONS.map((duration) => {
      const covered = discount.durations.includes(duration);
      const price = cost[duration];
      const final = covered ? applyRule(price, discount) : price;
      return {
        duration,
        covered,
        price,
        final,
        earning: calculateDues({ total: final, commission }).consultantEarning,
      };
    }),
  };
};
