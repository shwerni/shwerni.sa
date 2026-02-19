// prisma types
import { CouponType } from "@/lib/generated/prisma/enums";

interface DuesInput {
  total: number;
  commission: number; // consultant %
  coupon?: {
    discount: number; // percentage, e.g. 10 for 10%
    type: CouponType;
  };
}

interface DuesResult {
  consultantEarning: number;
  platformEarning: number;
  totalAfterCoupon: number;
}

/**
 * calculateDues
 * - does NOT include tax (per request)
 */
export function calculateDues({
  total,
  commission,
  coupon,
}: DuesInput): DuesResult {
  const platformPct = 100 - commission;

  // helper to avoid tiny floating errors and round to 2 decimals at return
  const round2 = (n: number) => Math.round(n * 100) / 100;

  let consultant = 0;
  let platform = 0;

  if (!coupon) {
    // simple split
    consultant = (commission / 100) * total;
    platform = (platformPct / 100) * total;
  } else {
    const discountFraction = coupon.discount / 100;
    const couponAmountOfTotal = discountFraction * total; // ALWAYS % of total per your rules

    switch (coupon.type) {
      case CouponType.GENERAL: {
        // subtract from whole total first, then split
        const discountedTotal = total - couponAmountOfTotal;
        consultant = (commission / 100) * discountedTotal;
        platform = (platformPct / 100) * discountedTotal;
        break;
      }

      case CouponType.PLATFORM: {
        // consultant unchanged (their full original share)
        consultant = (commission / 100) * total;
        // platform share is reduced by couponAmountOfTotal
        const platformBefore = (platformPct / 100) * total;
        platform = platformBefore - couponAmountOfTotal;
        break;
      }

      case CouponType.CONSULTANT: {
        // platform unchanged
        platform = (platformPct / 100) * total;
        // consultant share reduced by couponAmountOfTotal
        const consultantBefore = (commission / 100) * total;
        consultant = consultantBefore - couponAmountOfTotal;
        break;
      }

      case CouponType.CENTER: {
        // undefined behaviour — treat as no coupon
        consultant = (commission / 100) * total;
        platform = (platformPct / 100) * total;
        break;
      }
    }
  }

  // Clamp to zero (avoid negative due to too-large discounts)
  if (consultant < 0) consultant = 0;
  if (platform < 0) platform = 0;

  const totalAfterCoupon = consultant + platform;

  return {
    consultantEarning: round2(consultant),
    platformEarning: round2(platform),
    totalAfterCoupon: round2(totalAfterCoupon),
  };
}
