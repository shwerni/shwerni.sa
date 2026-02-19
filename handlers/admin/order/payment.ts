"use server";
// prima types
import { Order, PaymentMethod } from "@/lib/generated/prisma/client";

// lib
import {
  newOrdertelegram,
  telegram,
  telegramRefund,
} from "@/lib/api/telegram/telegram";

// utils
import { dateToString } from "@/utils/moment";

// types
import { Reservation } from "@/types/admin";

// constants
import { notificationNewOrder } from "@/lib/notifications";
import { createTabbyCheckout } from "@/lib/api/gatewaies/tabby";
import { createMoyasarCheckout } from "@/lib/api/gatewaies/moyasar";
import { ProgramReservationFormType, ReservationFormType } from "@/schemas";
import { reserveConsultant } from "@/data/order/reserveation";
import { saveACoupon } from "@/data/coupon";
import { redirect } from "next/navigation";
import { reserveProgram } from "@/data/order/program";

// on payment success
export const onPaymentSuccess = async (order: Reservation) => {
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
  data: ReservationFormType | ProgramReservationFormType,
  cost: number,
  total: number,
) {
  // order
  let order;

  // program or consultant
  if (data?.order === "consultant") {
    // create consultant order
    order = await reserveConsultant(data as ReservationFormType, cost);
  } else {
    // create program order
    order = await reserveProgram(data as ProgramReservationFormType, cost);
  }

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
