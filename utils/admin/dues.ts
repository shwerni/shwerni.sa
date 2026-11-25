// prisma types
import { CouponType } from "@/lib/generated/prisma/enums";

// what Payment.total holds changed when the current booking code went live: orders created before
// this moment saved the price BEFORE the coupon, later orders save the amount paid (after the
// coupon). from production data: the old code's last order is #14045 (2026-02-20 04:02 utc), the
// new code's first is #14049 (15:36 utc); no coupon order falls between them
export const PAID_TOTAL_SINCE = new Date("2026-02-20T12:00:00Z");

interface DuesInput {
  // Payment.total, before vat: the amount paid (after the coupon), or the price before the
  // coupon on orders created before PAID_TOTAL_SINCE
  total: number;
  commission: number; // consultant %
  coupon?: {
    discount: number; // percentage, e.g. 10 for 10%
    type: CouponType;
  };
  // the order's created_at: tells which of the two the total is (required with a coupon)
  createdAt?: Date | string;
  // Payment.originalTotal: the price before the coupon, stored at checkout. null on older
  // orders, which rebuild it from total and the discount
  originalTotal?: number | null;
}

interface DuesResult {
  consultantEarning: number;
  platformEarning: number;
  totalAfterCoupon: number;
}

/**
 * calculateDues
 * - does NOT include tax (per request)
 * - the coupon is taken off once: PLATFORM and CONSULTANT coupons give the protected side its
 *   share of the price before the coupon, and the other side gets the rest of the amount paid;
 *   GENERAL splits the amount paid; CENTER splits the total as is
 */
export function calculateDues({
  total,
  commission,
  coupon,
  createdAt,
  originalTotal,
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

    // the amount paid and the price before the coupon, from what this order's total holds:
    // the stored originalTotal when checkout wrote one, else rebuilt from the discount
    // (a 100% coupon leaves nothing to rebuild the original from)
    const legacy =
      createdAt !== undefined && new Date(createdAt) < PAID_TOTAL_SINCE;
    const paid = legacy ? total * (1 - discountFraction) : total;
    const original = legacy
      ? total
      : originalTotal != null && originalTotal > 0
        ? originalTotal
        : discountFraction < 1
          ? total / (1 - discountFraction)
          : total;

    switch (coupon.type) {
      case CouponType.GENERAL: {
        // the discount is shared: split the amount paid
        consultant = (commission / 100) * paid;
        platform = (platformPct / 100) * paid;
        break;
      }

      case CouponType.PLATFORM: {
        // consultant unchanged (their full share of the original price)
        consultant = (commission / 100) * original;
        // the platform takes the whole discount
        platform = paid - consultant;
        break;
      }

      case CouponType.CONSULTANT: {
        // platform unchanged (its full share of the original price)
        platform = (platformPct / 100) * original;
        // the consultant takes the whole discount
        consultant = paid - platform;
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
