import "server-only";
// React & Next
import { redirect } from "next/navigation";

// prima types
import {
  Order,
  OrderOrigin,
  OrderType,
  PaymentMethod,
  SessionType,
} from "@/lib/generated/prisma/client";

// lib
import {
  telegram,
  telegramAdmin,
  telegramRefund,
  newOrdertelegram,
} from "@/lib/api/telegram/telegram";

// utils
import { dateToString } from "@/utils/time";

// types
import { Reservation } from "@/types/admin";

// lib
import { notificationNewOrder } from "@/lib/notifications/site";
import { createTabbyCheckout } from "@/lib/api/gatewaies/tabby";
import { createMoyasarCheckout } from "@/lib/api/gatewaies/moyasar";

// schema
import {
  InstantFormType,
  ReservationFormType,
  ProgramReservationFormType,
} from "@/schemas";

// prisma data
import { applyCoupon, saveACoupon } from "@/data/coupon";
import { reserveInstant } from "@/data/online";
import { CheckIsBlocked } from "@/data/blocked";
import { createNewMeeting } from "@/data/rooms";
import { reserveProgram } from "@/data/order/program";
import { reserveConsultant } from "@/data/order/reserveation";
import { mobileNotifyOrderConfirmed } from "@/lib/notifications/mobile/notify/reservation";
import {
  getFinanceConfig,
  getPleadingCommission,
  getReconciliationConfig,
} from "@/data/admin/settings/finance";
import { resolveConsultantPricing } from "@/data/event";
import {
  getPleadingCheckout,
  getPleadingForCheckout,
  linkPaidPleading,
  linkPleadingCheckout,
} from "@/data/pleading";
import prisma from "@/lib/database/db";
import { calculatePayment } from "@/utils/admin/payments";
import {
  isQuoteOpen,
  PLEADING_DURATION,
  pleadingCheckoutSchema,
  type PleadingCheckoutInput,
} from "@/utils/pleading";
import { attachReconciliation } from "@/data/reconciliation";
import { getConsultantAvailableTimes } from "@/data/consultant";
import {
  add25Minutes,
  dateToWeekDay,
  getDatesAhead,
  // the same day string reserveConsultant stores on the meeting
  dateToString as meetingDay,
} from "@/utils/date";
import {
  RECONCILIATION_DURATION,
  reconciliationCheckoutSchema,
  type ReconciliationCheckoutInput,
} from "@/utils/reconciliation";
// the vat rate is the TAX_PERCENT constant; the finance.tax setting is no longer read for charges
import { TAX_PERCENT, withTax } from "@/utils/tax";
import { queueOrderInvoice } from "@/lib/daftra/auto";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { scheduleConsultantBusy } from "@/lib/api/realtime/consultant-busy";
import {
  INSTANT_DURATION,
  INSTANT_LIMIT_PER_IP,
  INSTANT_LIMIT_WINDOW_MS,
  instantIpRateKey,
} from "@/constants/instant";

// how a payment became PAID. the webhooks pass nothing (every default is the old behaviour).
// notifications: false sends nothing to the client, the consultant or the admin new-order
// telegram, and no invoice pdf on whatsapp; daftra: false sends no daftra invoice. the data
// steps (meeting, pleading link, wallet, PAID) always run, and error alerts still go to telegram
export type PaidOptions = {
  source?: "webhook" | "dashboard";
  notifications?: boolean;
  daftra?: boolean;
};

// on payment success
export const onPaymentSuccess = async (
  order: Reservation,
  options: PaidOptions = {},
) => {
  const notifications = options.notifications !== false;
  const daftra = options.daftra !== false;
  try {
    // validate
    if (!order || !order?.meeting?.[0]) return;
    // create room
    const newMeeting = await createNewMeeting(order.meeting[0]);
    // add meeting to order
    if (newMeeting) {
      order.meeting[0] = {
        ...order.meeting[0],
        ...newMeeting,
      };
    }
    // instant: the consultant goes offline until the meeting ends (database + realtime server).
    // after the response, never throws, never delays or breaks the payment
    if (order.type === OrderType.INSTANT) scheduleConsultantBusy(order);
    // a pleading checkout: the case becomes PAID and its whole chat moves onto this meeting.
    // a no-op (null) for every other order; never throws. a payment on a declined or
    // canceled case isn't linked and goes to the admin telegram for a refund
    await linkPaidPleading(order.oid, order.meeting[0].mid);
    if (notifications) {
      // send order notify
      if (order.origin === OrderOrigin.APP) {
        await mobileNotifyOrderConfirmed(order);
        // could remove later keep only app
        // await notificationNewOrder(order);
      } else {
        await notificationNewOrder(order);
      }

      // send telegram notify
      await newOrdertelegram(order);
    }
  } catch {
    // telegram admin
    await telegramAdmin(`error ocured order #${order.oid}`);
  }

  // the daftra invoice: queued after the response (by then the order is PAID: orderStatusPaid
  // claims PAID before this function). never throws and never delays the payment
  if (order?.oid && daftra)
    queueOrderInvoice(order.oid, { whatsapp: notifications });
};

// on payment refund
export const onPaymentRefund = async (order: Reservation, refund: number) => {
  // send whatsapp notify
  // await orderRefundNotification(
  //   order.oid,
  //   order.name,
  //   order.phone,
  //   order.consultant,
  //   cophone ?? "",
  //   order.date,
  //   order.time,
  //   refund
  // );
  // send telegram notify
  await telegramRefund(order);
};

// on payment hold
export const onPaymentHold = async (order: Order) => {
  // meeting label
  await telegram(
    `order #${order.oid} payment state is hold ${dateToString(new Date())}`,
  );
};

// the pleading checkout (مرافعة): one 60 minute session at the consultant's stored quote,
// never a coupon, a discount or the consultant's own pricing. a separate entry next to Pay (same
// steps, same gateways): Pay's input and the booking action stay as they are, and a pleading
// payment can only come through the checkoutPleading action. the input is the case token and
// the client's choices only; the price, consultant, name and phone all come from the stored case
export async function PayPleading(data: PleadingCheckoutInput) {
  // 0. the input shape (also checked by the action; Pay never trusts its caller)
  const parsed = pleadingCheckoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      state: false,
      step: "invalid",
      message: "بيانات النموذج غير صالحة، برجاء مراجعتها والمحاولة مرة أخرى",
    };
  }
  const { token, date, time, method } = parsed.data;

  // 1. the case by its link token (its expiry applied first)
  const pleading = await getPleadingForCheckout(token);
  if (!pleading) {
    return { state: false, step: "not_found", message: "الطلب غير موجود" };
  }

  // 2. an open quote, and a consultant who still takes pleading requests
  if (
    pleading.price === null ||
    !isQuoteOpen({
      state: pleading.state,
      price: pleading.price,
      expiresAt: pleading.expiresAt,
    })
  ) {
    return {
      state: false,
      step: "quote_closed",
      message: "انتهت صلاحية العرض أو لم يعد متاحاً للحجز",
    };
  }
  if (!pleading.consultant) {
    return {
      state: false,
      step: "unavailable",
      message: "هذا المستشار لا يستقبل طلبات المرافعة حالياً",
    };
  }

  // 3. block check (the case's phone, as every booking checks its own)
  if (await CheckIsBlocked(pleading.phone)) {
    return { state: false, step: "blocked", message: "هذا الحساب محظور" };
  }

  // 4. the case's current checkout: paid, or still running (PROCESSING, or NEW or HOLD under 20 minutes)
  const checkout = await getPleadingCheckout(pleading.id);
  if (checkout === "paid") {
    return { state: false, step: "already_paid", message: "تم دفع هذا الطلب بالفعل" };
  }
  if (checkout === "running") {
    return {
      state: false,
      step: "checkout_in_progress",
      message: "عملية الدفع قيد التنفيذ بالفعل",
    };
  }

  // 5. finance config (payment methods for the order row) and the pleading commission
  const [finance, commission] = await Promise.all([
    getFinanceConfig(),
    getPleadingCommission(),
  ]);
  if (!finance) {
    return {
      state: false,
      step: "finance",
      message: "تعذّر إتمام العملية، برجاء المحاولة لاحقاً",
    };
  }

  // 6. totals: the stored quote only, no discount
  const payment = calculatePayment({
    baseCost: pleading.price,
    tax: TAX_PERCENT,
    discountPercent: 0,
  });
  const cost = payment.total; // pre-tax → Payment.total
  const total = withTax(cost); // charged

  if (!Number.isFinite(total) || total <= 0) {
    return {
      state: false,
      step: "amount",
      message: "تعذّر حساب قيمة الدفع، برجاء المحاولة لاحقاً",
    };
  }

  // 7. the order, built on the server from the case (reserveConsultant re-validates it and
  //    checks the slot); the pleading commission wins over every other rate
  const formdata: ReservationFormType = {
    order: "pleading",
    user: pleading.author ?? "temp",
    cid: pleading.consultantId,
    consultant: pleading.consultant.name,
    collaboration: null,
    unavailable: [],
    cost: { 30: pleading.price, 45: pleading.price, 60: pleading.price },
    scale: null,
    times: {},
    finance: {
      tax: TAX_PERCENT,
      commission: finance.commission,
      payments: finance.payments,
      couponEnabled: false,
    },
    type: OrderType.SCHEDULED,
    sessionType: SessionType.ONCE,
    sessions: 1,
    package: null,
    date,
    time,
    duration: PLEADING_DURATION,
    name: pleading.name,
    phone: pleading.phone,
    notes: "",
    hasBeneficiary: false,
    method,
    hasCoupon: false,
    acceptTerms: true,
  };

  const result = await reserveConsultant(
    formdata,
    cost,
    TAX_PERCENT,
    finance.commission,
    OrderOrigin.PLATFORM,
    commission,
  );

  if (result.state === false) {
    return { ...result, step: result.code ?? "reserve" };
  }

  const order = result.order;
  if (!order || !order.payment) {
    return {
      state: false,
      step: "order_created_no_payment",
      message: "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى",
    };
  }

  // 8. compare-and-set: this order becomes the case's checkout only if no other checkout
  //    linked itself since step 1; the loser's NEW order is left to the cancel-orders cron
  if (!(await linkPleadingCheckout(pleading.id, pleading.orderId, order.oid))) {
    return {
      state: false,
      step: "checkout_in_progress",
      message: "عملية الدفع قيد التنفيذ بالفعل",
    };
  }

  // 9. hand off to the gateway with the server-computed total (as Pay does)
  if (method === PaymentMethod.visaMoyasar) {
    const moyasar = await createMoyasarCheckout(order.oid, total);
    if (!moyasar) {
      return {
        state: false,
        step: "moyasar",
        message: "فشل الدفع بالبطاقة، برجاء اختيار طريقة أخرى",
      };
    }
    redirect(moyasar);
  }

  if (method === PaymentMethod.tabby) {
    const tabby = await createTabbyCheckout(order, total);
    if (tabby.state === false) {
      return { state: false, step: "tabby", message: tabby.message };
    }
    redirect(tabby);
  }

  // order exists but no supported method matched — never charged
  return {
    state: false,
    step: "unsupported_method",
    message: "طريقة الدفع غير مدعومة",
  };
}

// the reconciliation booking (جلسة صلح): one 60 minute session with the consultant, price and
// share configured in the finance settings; never a coupon or a discount. a separate entry next
// to Pay, like PayPleading: Pay and the booking action stay as they are. the input is the
// client's choices only (checked again here); author comes from the server session, never input
export async function PayReconciliation(
  data: ReconciliationCheckoutInput,
  author: string | null,
) {
  // 0. the input shape (also checked by the action; Pay never trusts its caller)
  const parsed = reconciliationCheckoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      state: false,
      step: "invalid",
      message: "بيانات النموذج غير صالحة، برجاء مراجعتها والمحاولة مرة أخرى",
    };
  }
  const input = parsed.data;

  // 1. the configured consultant, price and share (finance settings; no consultant = unavailable)
  const config = await getReconciliationConfig();
  const consultant = config.cid
    ? await prisma.consultant.findFirst({
        where: { cid: config.cid },
        select: { name: true },
      })
    : null;
  if (!config.cid || !consultant) {
    return {
      state: false,
      step: "unavailable",
      message: "خدمة جلسات الصلح غير متاحة حالياً",
    };
  }

  // 2. block check (the client's phone, as every booking)
  if (await CheckIsBlocked(input.phone)) {
    return { state: false, step: "blocked", message: "هذا الحساب محظور" };
  }

  // 3. finance config (payment methods for the order row)
  const finance = await getFinanceConfig();
  if (!finance) {
    return {
      state: false,
      step: "finance",
      message: "تعذّر إتمام العملية، برجاء المحاولة لاحقاً",
    };
  }

  // 4. totals: the configured price only, no discount
  const payment = calculatePayment({
    baseCost: config.price,
    tax: TAX_PERCENT,
    discountPercent: 0,
  });
  const cost = payment.total; // pre-tax → Payment.total
  const total = withTax(cost); // charged

  if (!Number.isFinite(total) || total <= 0) {
    return {
      state: false,
      step: "amount",
      message: "تعذّر حساب قيمة الدفع، برجاء المحاولة لاحقاً",
    };
  }

  // 4b. the slot must be a real free time of the consultant's weekly timings: the same window and
  //     query the date step shows (7 days from riyadh now + 25 minutes, getDatesAhead +
  //     getConsultantAvailableTimes), never a second copy of their rules. a weekday with no
  //     timings (an unavailable day) has no times, so it fails too
  const day = meetingDay(input.date);
  const lead = add25Minutes();
  const free = getDatesAhead(7, lead.iso).includes(day)
    ? await getConsultantAvailableTimes(
        config.cid,
        day,
        // the weekday of that calendar day, independent of the server's time zone
        dateToWeekDay(new Date(`${day}T12:00:00Z`)),
        day === lead.date ? lead.time : undefined,
      )
    : {};
  if (!Object.values(free).some((times) => times?.includes(input.time))) {
    return {
      state: false,
      step: "slot_unavailable",
      message: "هذا الموعد غير متاح، برجاء اختيار وقت آخر",
    };
  }

  // 5. the order and its meeting, built on the server (reserveConsultant re-validates it, checks
  //    the slot and logs the same cid); the configured share wins over every other rate
  const formdata: ReservationFormType = {
    order: "reconciliation",
    user: author ?? "temp",
    cid: config.cid,
    consultant: consultant.name,
    collaboration: null,
    unavailable: [],
    cost: { 30: config.price, 45: config.price, 60: config.price },
    scale: null,
    times: {},
    finance: {
      tax: TAX_PERCENT,
      commission: finance.commission,
      payments: finance.payments,
      couponEnabled: false,
    },
    type: OrderType.SCHEDULED,
    sessionType: SessionType.ONCE,
    sessions: 1,
    package: null,
    date: input.date,
    time: input.time,
    duration: RECONCILIATION_DURATION,
    name: input.name,
    phone: input.phone,
    notes: "", // the brief is posted by attachReconciliation (it can exceed the 200 notes limit)
    hasBeneficiary: false,
    method: input.method,
    hasCoupon: false,
    acceptTerms: input.acceptTerms,
  };

  const result = await reserveConsultant(
    formdata,
    cost,
    TAX_PERCENT,
    finance.commission,
    OrderOrigin.PLATFORM,
    config.commission,
  );

  if (result.state === false) {
    return { ...result, step: result.code ?? "reserve" };
  }

  const order = result.order;
  const mid = order?.meeting?.[0]?.mid;
  if (!order || !order.payment || !mid) {
    return {
      state: false,
      step: "order_created_no_payment",
      message: "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى",
    };
  }

  // 6. the other party (the Reconciliation row, the marker) and the consultant's brief as the
  //    session chat's first message; on failure stop before the gateway (the cron cancels the order)
  const attached = await attachReconciliation(
    { id: order.id, oid: order.oid, mid },
    {
      otherName: input.otherName,
      otherPhone: input.otherPhone,
      relation: input.relation,
      gender: input.gender,
      description: input.description,
    },
  );
  if (!attached) {
    return {
      state: false,
      step: "attach",
      message: "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى",
    };
  }

  // 7. hand off to the gateway with the server-computed total (as Pay does)
  if (input.method === PaymentMethod.visaMoyasar) {
    const moyasar = await createMoyasarCheckout(order.oid, total);
    if (!moyasar) {
      return {
        state: false,
        step: "moyasar",
        message: "فشل الدفع بالبطاقة، برجاء اختيار طريقة أخرى",
      };
    }
    redirect(moyasar);
  }

  if (input.method === PaymentMethod.tabby) {
    const tabby = await createTabbyCheckout(order, total);
    if (tabby.state === false) {
      return { state: false, step: "tabby", message: tabby.message };
    }
    redirect(tabby);
  }

  // order exists but no supported method matched — never charged
  return {
    state: false,
    step: "unsupported_method",
    message: "طريقة الدفع غير مدعومة",
  };
}

export async function Pay(
  data: ReservationFormType | ProgramReservationFormType | InstantFormType,
) {
  // ---------------------------------------------------------------
  // 0. block check
  // ---------------------------------------------------------------
  const isBlocked = await CheckIsBlocked(data.phone);
  if (isBlocked) {
    return { state: false, step: "blocked", message: "هذا الحساب محظور" };
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

  if (data.order === "consultant") {
    const d = data as ReservationFormType;

    if (d.package) {
      // package price wins: flat, no event discount, no coupon
      const pkg = await prisma.package.findUnique({
        where: { id: d.package },
        select: { cost: true, consultantId: true, isActive: true },
      });

      if (!pkg || !pkg.isActive || pkg.consultantId !== d.cid) {
        return {
          state: false,
          step: "package",
          message: "الباقة غير متاحة حالياً",
        };
      }

      baseCost = pkg.cost;
    } else {
      const pricing = await resolveConsultantPricing(d.cid);
      if (!pricing) {
        return {
          state: false,
          step: "pricing",
          message: "تعذّر تحديد سعر الجلسة، برجاء المحاولة لاحقاً",
        };
      }

      baseCost = pricing.cost[Number(d.duration) as 30 | 45 | 60];

      // coupon allowed only if this duration isn't already discounted
      const durationDiscounted =
        pricing.discount?.durations.includes(Number(d.duration)) ?? false;

      if (!durationDiscounted && d.couponCode) {
        const coupon = await applyCoupon(d.user ?? "temp", d.couponCode, d.cid);
        // invalid/tampered coupon → ignore silently, charge full price
        if (coupon.state && typeof coupon.discount === "number")
          discountPercent = coupon.discount;
      }
    }
  } else if (data.order === "instant") {
    const i = data as InstantFormType;

    const pricing = await resolveConsultantPricing(i.cid);
    if (!pricing) {
      return {
        state: false,
        step: "pricing",
        message: "تعذّر تحديد سعر الجلسة، برجاء المحاولة لاحقاً",
      };
    }

    // instant sessions are INSTANT_DURATION long whatever the form sends (reserveInstant too)
    baseCost = pricing.cost[INSTANT_DURATION];
  } else if (data.order === "program") {
    const p = data as ProgramReservationFormType;

    const program = await prisma.program.findUnique({
      where: { prid: p.prid },
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

  // ---------------------------------------------------------------
  // 4. create the order — tax + commission passed in, never re-read
  //    from the client's `data`
  // ---------------------------------------------------------------
  type ConsultantResult = Awaited<ReturnType<typeof reserveConsultant>>;
  type ProgramResult = Awaited<ReturnType<typeof reserveProgram>>;
  type InstantResult = Awaited<ReturnType<typeof reserveInstant>>;

  let result: ConsultantResult | ProgramResult | InstantResult | undefined;

  if (data.order === "consultant")
    result = await reserveConsultant(
      data as ReservationFormType,
      cost,
      TAX_PERCENT,
      finance.commission,
    );

  if (data.order === "program")
    result = await reserveProgram(
      data as ProgramReservationFormType,
      cost,
      TAX_PERCENT,
    );

  if (data.order === "instant")
    result = await reserveInstant(
      data as InstantFormType,
      cost,
      TAX_PERCENT,
      finance.commission,
    );

  if (!result) {
    return { state: false, step: "order_type", message: "نوع الطلب غير صالح" };
  }

  if (result.state === false) {
    return { ...result, step: result.code ?? "reserve" };
  }

  const order = result.order;
  if (!order || !order.payment) {
    return {
      state: false,
      step: "order_created_no_payment",
      message: "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى",
    };
  }

  // instant: one more created order for this ip (the Pay action reads the count first)
  if (data.order === "instant")
    await rateLimit(instantIpRateKey(await getClientIp()), {
      limit: INSTANT_LIMIT_PER_IP,
      window: `${INSTANT_LIMIT_WINDOW_MS / 60_000} m`,
    });

  // ---------------------------------------------------------------
  // 5. record coupon usage with the SERVER-verified percent
  // ---------------------------------------------------------------
  if (discountPercent > 0 && data.couponCode) {
    await saveACoupon(data.user ?? "temp", data.couponCode, order.payment.id);
  }

  // ---------------------------------------------------------------
  // 6. hand off to the gateway with the server-computed total
  // ---------------------------------------------------------------
  if (data.method === PaymentMethod.visaMoyasar) {
    const moyasar = await createMoyasarCheckout(order.oid, total);
    if (!moyasar) {
      return {
        state: false,
        step: "moyasar",
        message: "فشل الدفع بالبطاقة، برجاء اختيار طريقة أخرى",
      };
    }
    redirect(moyasar);
  }

  if (data.method === PaymentMethod.tabby) {
    const tabby = await createTabbyCheckout(order, total);
    if (tabby.state === false) {
      return { state: false, step: "tabby", message: tabby.message };
    }
    redirect(tabby);
  }

  // order exists but no supported method matched — never charged
  return {
    state: false,
    step: "unsupported_method",
    message: "طريقة الدفع غير مدعومة",
  };
}
