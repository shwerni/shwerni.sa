import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { validateCoupon } from "@/data/coupon";
import { CheckIsBlocked } from "@/data/blocked";
import { resolveConsultantPricing } from "@/data/event";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// utils
import { TAX_PERCENT, withTax } from "@/utils/tax";
import { calculatePayment } from "@/utils/admin/payments";
import { COUPON_MESSAGES, type CouponReason } from "@/utils/coupon";

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
  // the percent the client's preview showed (the website's forms); Pay refuses a different one
  couponPercent?: number | null;
  prid?: number;
}

export interface BookingQuoteOptions {
  // Pay and the app's create routes: a coupon that doesn't apply (or no longer gives the previewed
  // percent) stops the booking with its message, never a full-price charge. the previews (the coupon
  // form, the app's quote) keep the quote and read couponError instead
  strictCoupon?: boolean;
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
  couponReason: CouponReason | null;
  // sar before tax after the coupon (Payment.total), and the tax-inclusive charge
  cost: number;
  total: number;
}

/**
 * the price of a booking, all on the server: the website's Pay, its coupon preview, the app's
 * quote and the app's create routes all call it, so they can't differ. block check (with a
 * phone), finance config, the base price (a package's flat cost; else resolveConsultantPricing,
 * the campaign applied; instant at INSTANT_DURATION; a published program's price), the coupon
 * (validateCoupon: single and instant sessions only, never on a campaign price), calculatePayment
 * and withTax. nothing created
 * @param data the booking's choices
 * @param options strictCoupon: a coupon that doesn't apply is a failure (Pay, the app's create)
 */
export async function quoteBooking(
  data: BookingQuoteInput,
  options: BookingQuoteOptions = {},
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
  // the booked duration has a campaign price (no coupon on top of it)
  let durationDiscounted = false;

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
    } else {
      // the requested length is priced even outside the effective set (no refusal before
      // pricing step 4), from the same prices as before
      const minutes = Number(data.duration);
      const pricing = await resolveConsultantPricing(
        data.cid,
        Number.isInteger(minutes) ? [minutes] : [],
      );
      if (!pricing) {
        return {
          state: false,
          step: "pricing",
          message: "تعذّر تحديد سعر الجلسة، برجاء المحاولة لاحقاً",
        };
      }

      baseCost = pricing.cost[String(minutes)];

      durationDiscounted =
        pricing.discount?.durations.includes(Number(data.duration)) ?? false;
      if (durationDiscounted && pricing.discount) {
        campaign = { did: pricing.discount.did, label: pricing.discount.label };
      }
    }
  } else if (data.order === "instant" && data.cid !== undefined) {
    // instant is a fixed product: priced at INSTANT_DURATION whatever the consultant's lengths
    const pricing = await resolveConsultantPricing(data.cid, [INSTANT_DURATION]);
    if (!pricing) {
      return {
        state: false,
        step: "pricing",
        message: "تعذّر تحديد سعر الجلسة، برجاء المحاولة لاحقاً",
      };
    }

    // instant sessions are INSTANT_DURATION long whatever the form sends (reserveInstant too)
    baseCost = pricing.cost[String(INSTANT_DURATION)];
    durationDiscounted =
      pricing.discount?.durations.includes(INSTANT_DURATION) ?? false;
    if (durationDiscounted && pricing.discount) {
      campaign = { did: pricing.discount.did, label: pricing.discount.label };
    }
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
  } else {
    return {
      state: false,
      step: "order_type",
      message: "نوع الطلب غير صالح",
    };
  }

  // ---------------------------------------------------------------
  // 2b. the coupon: validateCoupon, the same verdict the coupon form's preview gets
  // ---------------------------------------------------------------
  let coupon: BookingQuote["coupon"] = null;
  let couponError: string | null = null;
  let couponReason: CouponReason | null = null;

  if (data.couponCode?.trim()) {
    const verdict = await validateCoupon(data.user ?? "temp", data.couponCode, {
      order: data.order,
      cid: data.cid ?? 0,
      package: data.package,
      durationDiscounted,
      couponsEnabled: finance.couponEnabled,
    });

    if (verdict.ok) {
      discountPercent = verdict.percent;
      if (verdict.percent > 0)
        coupon = { code: verdict.code, percent: verdict.percent };
    } else {
      couponError = verdict.message;
      couponReason = verdict.reason;
    }

    // Pay: never a full-price charge for a coupon the client saw applied
    if (options.strictCoupon) {
      if (!verdict.ok)
        return { state: false, step: "coupon", message: verdict.message };
      if (
        typeof data.couponPercent === "number" &&
        data.couponPercent !== verdict.percent
      )
        return {
          state: false,
          step: "coupon",
          message: COUPON_MESSAGES.changed,
        };
    }
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
    coupon,
    couponError,
    couponReason,
    cost,
    total,
  };
}
