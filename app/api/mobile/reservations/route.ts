// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { TAX_PERCENT } from "@/utils/tax";
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
import { saveACoupon } from "@/data/coupon";
import { CheckIsBlocked } from "@/data/blocked";
import { reserveConsultant } from "@/data/order/reserveation";
import { isBookableSlot } from "@/data/booking/slots";
import {
  accountPhone,
  cancelUnpaidOrders,
  ownUnpaidAtSlot,
  packageSessionCount,
  unpaidOrderLimitReached,
} from "@/data/mobile/booking";

// schemas
import { schemas } from "@/schemas/schemas";
import type { ReservationFormType } from "@/schemas";

// prisma types
import { OrderOrigin, OrderType, SessionType } from "@/lib/generated/prisma/enums";

// the client's choices only: never a price, a total, a tax, a commission, a coupon percent or a user
const ScheduledSchema = z
  .object({
    cid: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    duration: z.union([z.literal(30), z.literal(45), z.literal(60)]).optional(),
    package: z.string().trim().min(1).max(64).optional(),
    name: schemas.name,
    phone: schemas.phone,
    notes: z.string().max(200).optional(),
    method: z.enum(["visaMoyasar", "tabby"]),
    couponCode: z.string().trim().min(1).max(32).optional(),
    wallet: z.boolean().optional(),
    beneficiary: z.object({ name: schemas.name, phone: schemas.phone }).optional(),
  })
  .refine((b) => b.duration !== undefined || b.package !== undefined);

// quoteBooking's and reserveConsultant's failures as the app's errors
const failureStatus: Record<string, number> = {
  blocked: 403,
  coupon: 409,
  package: 404,
  pricing: 404,
  owner_missing: 404,
  conflict: 409,
  invalid: 400,
  order_type: 400,
};

const SLOT_TAKEN = "هذا الموعد غير متاح، برجاء اختيار وقت آخر";
const CREATE_FAILED = "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى";

// a scheduled booking from the app: Pay's rules with the session's user and origin APP. the price is
// quoteBooking (the same as the quote and the website), the slot must be one of the consultant's
// free slots now, and the app gets the next step (its in-app card screen, tabby, or paid by the
// wallet) instead of a redirect
export const POST = createPostRoute<BookingCreated>(
  async (request: NextRequest) => {
    const user = await requireMobileUser(request);

    const body = await request.json().catch(() => null);
    const parsed = ScheduledSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const input = parsed.data;

    // the account's own phone is checked whatever the form sends (the form's phone: quoteBooking)
    const phone = await accountPhone(user.id);
    if (phone && (await CheckIsBlocked(phone))) throw new HttpError("هذا الحساب محظور", 403);

    if (await unpaidOrderLimitReached(user.id)) {
      throw new HttpError("عدد كبير من المحاولات، حاول لاحقاً", 429);
    }

    // strict: a coupon that doesn't apply is a 409 with its message, never a full-price charge
    const quote = await quoteBooking(
      {
        order: "consultant",
        phone: input.phone,
        user: user.id,
        cid: input.cid,
        duration: input.duration,
        package: input.package,
        couponCode: input.couponCode,
      },
      { strictCoupon: true },
    );
    if (!quote.state) throw new HttpError(quote.message, failureStatus[quote.step] ?? 500);

    // the website's package booking: its session count, 45 minutes each
    const sessions = input.package ? await packageSessionCount(input.package) : 1;
    if (!sessions) throw new HttpError("الباقة غير متاحة حالياً", 404);

    // the client's own unpaid order for this slot doesn't hold it against them (it's cancelled below)
    const own = await ownUnpaidAtSlot(user.id, input.cid, input.date, input.time);
    if (!(await isBookableSlot(input.cid, input.date, input.time, own))) {
      throw new HttpError(SLOT_TAKEN, 409);
    }

    // before the order exists: tabby with the wallet or a method the config doesn't allow → 400
    const plan = await planAppPayment(
      user.id,
      quote.total,
      input.wallet,
      input.method,
      quote.finance.payments,
    );

    // the order, built on the server (reserveConsultant re-validates it and checks the slot)
    const formdata: ReservationFormType = {
      order: "consultant",
      user: user.id,
      cid: input.cid,
      consultant: "",
      collaboration: null,
      unavailable: [],
      cost: { 30: quote.cost, 45: quote.cost, 60: quote.cost },
      scale: null,
      times: {},
      finance: {
        tax: TAX_PERCENT,
        commission: quote.finance.commission,
        payments: quote.finance.payments,
        couponEnabled: quote.finance.couponEnabled,
      },
      type: OrderType.SCHEDULED,
      sessionType: input.package ? SessionType.MULTIPLE : SessionType.ONCE,
      sessions,
      package: input.package ?? null,
      date: new Date(`${input.date}T00:00:00Z`),
      time: input.time,
      duration: input.package ? "45" : String(input.duration),
      name: input.name,
      phone: input.phone,
      notes: input.notes ?? "",
      hasBeneficiary: !!input.beneficiary,
      beneficiaryName: input.beneficiary?.name,
      beneficiaryPhone: input.beneficiary?.phone,
      method: input.method,
      // the coupon is recorded below (saveACoupon); reserveConsultant doesn't store it
      hasCoupon: false,
      acceptTerms: true,
    };

    const result = await reserveConsultant(
      formdata,
      quote.cost,
      TAX_PERCENT,
      quote.finance.commission,
      OrderOrigin.APP,
      undefined,
      quote.base, // the price before the coupon → Payment.originalTotal
    );
    if (result.state === false) {
      throw new HttpError(
        result.message ?? CREATE_FAILED,
        failureStatus[result.code ?? ""] ?? 500,
      );
    }
    const payment = result.order?.payment;
    if (!result.order || !payment) throw new HttpError(CREATE_FAILED, 500);
    const order = { oid: result.order.oid, payment };

    // never two unpaid orders of one client for the same slot
    await cancelUnpaidOrders(own);

    // the coupon's use, with the server-verified percent (Pay's step 5)
    if (quote.coupon) await saveACoupon(user.id, quote.coupon.code, payment.id);

    return finishAppBooking(order, plan, input.method, quote.total);
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
