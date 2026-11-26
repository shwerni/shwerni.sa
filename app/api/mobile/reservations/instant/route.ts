// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { TAX_PERCENT } from "@/utils/tax";
import { addNMinutes } from "@/utils/date";
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// handlers
import { quoteBooking } from "@/handlers/admin/order/booking-quote";
import {
  finishAppBooking,
  planAppPayment,
  type BookingCreated,
} from "@/handlers/admin/order/app-booking";

// prisma data
import { CheckIsBlocked } from "@/data/blocked";
import { saveACoupon } from "@/data/coupon";
import { reserveInstant } from "@/data/online";
import { INSTANT_BUSY, INSTANT_UNAVAILABLE } from "@/data/mobile/instant-availability";
import {
  accountPhone,
  instantLimitReached,
  unpaidOrderLimitReached,
} from "@/data/mobile/booking";

// schemas
import { schemas } from "@/schemas/schemas";
import type { InstantFormType } from "@/schemas";

// constants
import { INSTANT_DURATION } from "@/constants/instant";

// prisma types
import { OrderOrigin } from "@/lib/generated/prisma/enums";

// the client's choices only: no date, time, duration, price or user (the server's clock,
// INSTANT_DURATION and the price). the coupon code is optional, checked like a single session's
const InstantSchema = z.object({
  cid: z.number().int().positive(),
  name: schemas.name,
  phone: schemas.phone,
  notes: z.string().max(200).optional(),
  method: z.enum(["visaMoyasar", "tabby"]),
  wallet: z.boolean().optional(),
  couponCode: z.string().trim().min(1).max(32).optional(),
});

// quoteBooking's failures as the app's errors
const failureStatus: Record<string, number> = {
  blocked: 403,
  coupon: 409,
  pricing: 404,
  order_type: 400,
};

const CREATE_FAILED = "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى";
const RATE_LIMITED = "عدد كبير من المحاولات، حاول لاحقاً";

// an instant booking from the app: Pay's instant rules with the session's user and origin APP.
// the price is quoteBooking (INSTANT_DURATION, the coupon if any); reserveInstant, under its lock, decides
// whether the consultant is bookable now (online, listable, not busy, no other client paying)
export const POST = createPostRoute<BookingCreated>(
  async (request: NextRequest) => {
    const user = await requireMobileUser(request);

    const body = await request.json().catch(() => null);
    const parsed = InstantSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const input = parsed.data;

    // the account's own phone is checked whatever the form sends (the form's phone: quoteBooking)
    const phone = await accountPhone(user.id);
    if (phone && (await CheckIsBlocked(phone))) throw new HttpError("هذا الحساب محظور", 403);

    // the website's instant limit per phone, the same per account (no ip limit), and the app's unpaid limit
    if (
      (await instantLimitReached(user.id, input.phone)) ||
      (await unpaidOrderLimitReached(user.id))
    ) {
      throw new HttpError(RATE_LIMITED, 429);
    }

    // strict: a coupon that doesn't apply is a 409 with its message, never a full-price charge
    const quote = await quoteBooking(
      {
        order: "instant",
        phone: input.phone,
        user: user.id,
        cid: input.cid,
        couponCode: input.couponCode,
      },
      { strictCoupon: true },
    );
    if (!quote.state) throw new HttpError(quote.message, failureStatus[quote.step] ?? 500);

    // before the order exists: tabby with the wallet or a method the config doesn't allow → 400
    const plan = await planAppPayment(
      user.id,
      quote.total,
      input.wallet,
      input.method,
      quote.finance.payments,
    );

    // reserveInstant takes the session's start from the server clock; these are for the schema only
    const slot = addNMinutes();
    const formdata: InstantFormType = {
      order: "instant",
      user: user.id,
      cid: input.cid,
      cost: quote.cost,
      date: new Date(),
      duration: INSTANT_DURATION,
      consultant: "",
      time: slot.time,
      finance: {
        tax: TAX_PERCENT,
        commission: quote.finance.commission,
        payments: quote.finance.payments,
        couponEnabled: quote.finance.couponEnabled,
      },
      name: input.name,
      phone: input.phone,
      notes: input.notes ?? "",
      method: input.method,
      hasCoupon: false,
      acceptTerms: true,
    };

    const result = await reserveInstant(
      formdata,
      quote.cost,
      TAX_PERCENT,
      quote.finance.commission,
      OrderOrigin.APP,
      quote.base, // the price before the coupon → Payment.originalTotal
    );
    if (result.state === false) {
      // not online / listable, busy, or another client paying → 409 with reserveInstant's message
      const refused = result.message === INSTANT_UNAVAILABLE || result.message === INSTANT_BUSY;
      throw new HttpError(result.message ?? CREATE_FAILED, refused ? 409 : 500);
    }
    const payment = result.order?.payment;
    if (!result.order || !payment) throw new HttpError(CREATE_FAILED, 500);

    // the coupon's use, with the server-verified percent (as the scheduled route)
    if (quote.coupon) await saveACoupon(user.id, quote.coupon.code, payment.id);

    return finishAppBooking({ oid: result.order.oid, payment }, plan, input.method, quote.total);
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
