"use server";
// React & Next
import { redirect } from "next/navigation";

// prima types
import { Order, PaymentMethod } from "@/lib/generated/prisma/client";

// lib
import {
  telegram,
  telegramRefund,
  newOrdertelegram,
} from "@/lib/api/telegram/telegram";

// utils
import { dateToString } from "@/utils/time";

// types
import { Reservation } from "@/types/admin";

// lib
import { notificationNewOrder } from "@/lib/notifications";
import { createTabbyCheckout } from "@/lib/api/gatewaies/tabby";
import { createMoyasarCheckout } from "@/lib/api/gatewaies/moyasar";

// schema
import {
  InstantFormType,
  ProgramReservationFormType,
  ReservationFormType,
} from "@/schemas";

// prisma data
import { saveACoupon } from "@/data/coupon";
import { reserveInstant } from "@/data/online";
import { createNewMeeting } from "@/data/room";
import { reserveProgram } from "@/data/order/program";
import { reserveConsultant } from "@/data/order/reserveation";
import { CheckIsBlocked } from "@/data/blocked";

// on payment success
export const onPaymentSuccess = async (order: Reservation) => {
  // validate
  if (!order || !order?.meeting?.[0]) return;

  // create room
  await createNewMeeting(order.meeting[0]);
  // send order notify
  await notificationNewOrder(order);
  // send telegram notify
  await newOrdertelegram(order);
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
  cost: number,
  total: number,
) {
  // check if blocked
  const isBLocked = await CheckIsBlocked(data.phone);

  // vakidate
  if (isBLocked) return { state: false, message: "هذا الحساب محظور" };

  // order
  let order;

  // program or consultant
  if (data?.order === "consultant")
    // create consultant order
    order = await reserveConsultant(data as ReservationFormType, cost);

  if (data?.order === "program")
    // create program order
    order = await reserveProgram(data as ProgramReservationFormType, cost);

  if (data?.order === "instant")
    // create instant order
    order = await reserveInstant(data as InstantFormType, cost);

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
}
