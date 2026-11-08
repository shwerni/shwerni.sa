import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { applyCoupon } from "@/data/coupon";
import { CheckIsBlocked } from "@/data/blocked";
import { resolveConsultantPricing } from "@/data/event";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// utils
import { TAX_PERCENT, withTax } from "@/utils/tax";
import { calculatePayment } from "@/utils/admin/payments";

// constants
import { INSTANT_DURATION } from "@/constants/instant";

// what the price depends on: the website's booking forms (Pay) and the app's bodies both fit it.
// phone: the block check runs only when it's given (the app's quote has no form phone yet)
export interface BookingQuoteInput {
  order: string; // "consultant" | "instant" | "program"
  phone?: string;
  user?: string; // the coupon's user ("temp" for a guest)
  cid?: number;
  duration?: number | string | null;
  package?: string | null;
  couponCode?: string | null;
  prid?: number;
}

export interface BookingQuoteFailure {
  state: false;
  step: string;
  message: string;
}

export interface BookingQuote {
  state: true;
  finance: NonNullable<Awaited<ReturnType<typeof getFinanceConfig>>>;
  // sar before tax: the consultant's price (campaign applied), the package's or the program's
  base: number;
  campaign: { did: number; label: string } | null;
  discountPercent: number;
  coupon: { code: string; percent: number } | null;
  couponError: string | null;
  // sar before tax after the coupon (Payment.total), and the tax-inclusive charge
  cost: number;
  total: number;
}

// a coupon sent where the website's rule doesn't allow one (the app's quote shows why; Pay ignores it)
const COUPON_NOT_ALLOWED = "لا يمكن استخدام الكوبون مع هذا الحجز";

/**
 * the price of a booking, all on the server: Pay's steps 0-3, moved here unchanged so the
 * website's Pay, the app's quote and the app's create routes can't differ. block check (with a
 * phone), finance config, the base price (a package's flat cost; else resolveConsultantPricing,
 * the campaign applied, a coupon only on a duration it doesn't discount; instant at
 * INSTANT_DURATION; a published program's price), calculatePayment and withTax. nothing created
 * @param data the booking's choices
 */
export async function quoteBooking(
  data: BookingQuoteInput,
): Promise<BookingQuote | BookingQuoteFailure> {
  // ---------------------------------------------------------------
  // 0. block check
  // ---------------------------------------------------------------
  if (data.phone !== undefined) {
    const isBlocked = await CheckIsBlocked(data.phone);
    if (isBlocked) {
      return { state: false, step: "blocked", message: "هذا الحساب محظور" };
    }
  }

  // ---------------------------------------------------------------
  // 1. finance config — the ONLY source for tax + platform commission
  // ---------------------------------------------------------------
  const finance = await getFinanceConfig();
  if (!finance) {
    return {
      state: false,
      step: "finance",
      message: "تعذّر إتمام العملية، برجاء المحاولة لاحقاً",
    };
  }

  // ---------------------------------------------------------------
  // 2. resolve base cost + coupon — all server side
  // ---------------------------------------------------------------
  let baseCost: number;
  let discountPercent = 0;
  let campaign: BookingQuote["campaign"] = null;
  let couponError: string | null = null;

  if (data.order === "consultant" && data.cid !== undefined) {
    if (data.package) {
      // package price wins: flat, no event discount, no coupon
      const pkg = await prisma.package.findUnique({
        where: { id: data.package },
        select: { cost: true, consultantId: true, isActive: true },
      });

      if (!pkg || !pkg.isActive || pkg.consultantId !== data.cid) {
        return {
          state: false,
          step: "package",
          message: "الباقة غير متاحة حالياً",
        };
      }

      baseCost = pkg.cost;
      if (data.couponCode) couponError = COUPON_NOT_ALLOWED;
    } else {
      const pricing = await resolveConsultantPricing(data.cid);
      if (!pricing) {
        return {
          state: false,
          step: "pricing",
          message: "تعذّر تحديد سعر الجلسة، برجاء المحاولة لاحقاً",
        };
      }

      baseCost = pricing.cost[Number(data.duration) as 30 | 45 | 60];

      // coupon allowed only if this duration isn't already discounted
      const durationDiscounted =
        pricing.discount?.durations.includes(Number(data.duration)) ?? false;
      if (durationDiscounted && pricing.discount) {
        campaign = { did: pricing.discount.did, label: pricing.discount.label };
      }

      if (!durationDiscounted && data.couponCode) {
        const coupon = await applyCoupon(data.user ?? "temp", data.couponCode, data.cid);
        // invalid/tampered coupon → ignore silently, charge full price
        if (coupon.state && typeof coupon.discount === "number")
          discountPercent = coupon.discount;
        else couponError = coupon.message ?? COUPON_NOT_ALLOWED;
      } else if (data.couponCode) {
        couponError = COUPON_NOT_ALLOWED;
      }
    }
  } else if (data.order === "instant" && data.cid !== undefined) {
    const pricing = await resolveConsultantPricing(data.cid);
    if (!pricing) {
      return {
        state: false,
        step: "pricing",
        message: "تعذّر تحديد سعر الجلسة، برجاء المحاولة لاحقاً",
      };
    }

    // instant sessions are INSTANT_DURATION long whatever the form sends (reserveInstant too)
    baseCost = pricing.cost[INSTANT_DURATION];
    if (pricing.discount?.durations.includes(INSTANT_DURATION)) {
      campaign = { did: pricing.discount.did, label: pricing.discount.label };
    }
    if (data.couponCode) couponError = COUPON_NOT_ALLOWED;
  } else if (data.order === "program" && data.prid !== undefined) {
    const program = await prisma.program.findUnique({
      where: { prid: data.prid },
      select: { price: true, status: true },
    });

    if (!program || program.status !== "PUBLISHED") {
      return {
        state: false,
        step: "program",
        message: "البرنامج غير متاح حالياً",
      };
    }

    baseCost = program.price;
    if (data.couponCode) couponError = COUPON_NOT_ALLOWED;
  } else {
    return {
      state: false,
      step: "order_type",
      message: "نوع الطلب غير صالح",
    };
  }

  // ---------------------------------------------------------------
  // 3. compute totals — the ONLY place amounts are calculated
  // ---------------------------------------------------------------
  const payment = calculatePayment({
    baseCost,
    tax: TAX_PERCENT,
    discountPercent,
  });

  const cost = payment.total; // pre-tax, discounted → Payment.total
  // tax-inclusive → charged to the card; computed from the stored (rounded) total so every
  // later check (webhooks, mobile) gets exactly this amount back from the order
  const total = withTax(cost);

  if (!Number.isFinite(total) || total <= 0) {
    return {
      state: false,
      step: "amount",
      message: "تعذّر حساب قيمة الدفع، برجاء المحاولة لاحقاً",
    };
  }

  return {
    state: true,
    finance,
    base: baseCost,
    campaign,
    discountPercent,
    coupon:
      discountPercent > 0 && data.couponCode
        ? { code: data.couponCode, percent: discountPercent }
        : null,
    couponError,
    cost,
    total,
  };
}
