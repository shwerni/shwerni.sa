"use server";
// React & Next
import { redirect } from "next/navigation";

// prima types
import {
  Order,
  OrderOrigin,
  PaymentMethod,
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
import { getFinanceConfig } from "@/data/admin/settings/finance";
import { resolveConsultantPricing } from "@/data/event";
import prisma from "@/lib/database/db";
import { calculatePayment } from "@/utils/admin/payments";

// on payment success
export const onPaymentSuccess = async (order: Reservation) => {
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
  } catch {
    // telegram admin
    await telegramAdmin(`error ocured order #${order.oid}`);
  }
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

    baseCost = pricing.cost[Number(i.duration) as 30 | 45 | 60];
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
    tax: finance.tax,
    discountPercent,
  });

  const cost = payment.total; // pre-tax, discounted → Payment.total
  const total = payment.totalWTax; // tax-inclusive → charged to the card

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
      finance.tax,
      finance.commission,
    );

  if (data.order === "program")
    result = await reserveProgram(
      data as ProgramReservationFormType,
      cost,
      finance.tax,
    );

  if (data.order === "instant")
    result = await reserveInstant(
      data as InstantFormType,
      cost,
      finance.tax,
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
