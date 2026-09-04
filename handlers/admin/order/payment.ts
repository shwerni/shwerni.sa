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
import { saveACoupon } from "@/data/coupon";
import { reserveInstant } from "@/data/online";
import { CheckIsBlocked } from "@/data/blocked";
import { createNewMeeting } from "@/data/rooms";
import { reserveProgram } from "@/data/order/program";
import { reserveConsultant } from "@/data/order/reserveation";
import { mobileNotifyOrderConfirmed } from "@/lib/notifications/mobile/notify/reservation";

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

// discriminated result
type ReserveResult<T> =
  | { state: true; order: T }
  | {
      state: false;
      code: "invalid" | "conflict" | "owner_missing" | "error";
      message: string;
    };

export async function Pay(
  data: ReservationFormType | ProgramReservationFormType | InstantFormType,
  cost: number,
  total: number,
) {
  // check if blocked
  const isBLocked = await CheckIsBlocked(data.phone);

  // vakidate
  if (isBLocked) return { state: false, message: "هذا الحساب محظور" };

  // results type
  type ConsultantResult = Awaited<ReturnType<typeof reserveConsultant>>;
  type ProgramResult = Awaited<ReturnType<typeof reserveProgram>>;
  type InstantResult = Awaited<ReturnType<typeof reserveInstant>>;

  // order
  let result: ConsultantResult | ProgramResult | InstantResult | undefined;

  // program or consultant
  if (data?.order === "consultant")
    // create consultant order
    result = await reserveConsultant(data as ReservationFormType, cost);

  if (data?.order === "program")
    // create program order
    result = await reserveProgram(data as ProgramReservationFormType, cost);

  if (data?.order === "instant")
    // create instant order
    result = await reserveInstant(data as InstantFormType, cost);

  if (!result) return { state: false, message: "نوع الطلب غير صالح" };
  if (result.state === false) return result;

  // order
  const order = result.order;

  // todo
  // if user will pay full price with wallet credit
  // if (author && total <= 1 && useWallet) {
  //   // pay by wallet
  //   await payAllByWallet(
  //     author,
  //     order.oid,
  //     zid,
  //     payment.total,
  //     payment.tax,
  //     withdrawPay,
  //   );
  //   // redirect on success to paid success page
  //   router.push(`/payment/paid?id=${zid}&status=paid`);
  // }

  // validate
  if (!order || !order.payment) return { state: false, message: "حدث خطأ ما" };

  // if user will use a coupon
  if (data.couponPercent && data.couponCode && order?.payment) {
    await saveACoupon(data.user ?? "temp", data.couponCode, order?.payment.id);
  }

  // todo
  // if user will pay partially price with credit
  // if (total > 1 && useWallet) {
  //   await requestUsingWallet(order.oid, withdrawPay);
  // }

  // if moyasar selected
  if (data.method === PaymentMethod.visaMoyasar) {
    // create moyasar checkout
    const moyasar = await createMoyasarCheckout(order.oid, total);
    // if success
    if (!moyasar)
      return {
        state: false,
        message: "فشل الدفع بأستخدام الفيزا برجاء اختيار طريقة اخري",
      };

    // redirect
    redirect(moyasar);
  }

  // if tabby selected
  if (data.method === PaymentMethod.tabby) {
    // create moyasar checkout
    const tabby = await createTabbyCheckout(order, total);
    // if success
    if (tabby.state == false)
      return {
        state: false,
        message: tabby.message,
      };

    // redirect
    redirect(tabby);
  }

  // No matching payment method — order was created but never charged.
  return { state: false, message: "طريقة الدفع غير مدعومة" };
}
