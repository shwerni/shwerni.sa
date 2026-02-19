"use server";
// prisma data
import {
  getReservationPaymentByPid,
  updateOrderStatus,
} from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// lib
import { telegramAdmin } from "@/lib/api/telegram/telegram";
import { moyasarPaymentStatus } from "@/lib/api/gatewaies/moyasar";

// types
interface Moyasar {
  invoice_id: string;
  status: string;
  source: {
    message: string;
  };
}

// payment state update
async function CheckPaymentState(payment: Moyasar) {
  // payment status
  const status = await moyasarPaymentStatus(payment.invoice_id);

  // get order by payment id
  const order = await getReservationPaymentByPid(payment.invoice_id);

  // order payment
  const orderPayment = order?.payment;

  // check if already paid
  if (
    !orderPayment?.payment ||
    (orderPayment?.payment === PaymentState.PAID && status === "paid")
  ) {
    // return
    return;
  }

  // if moyasr payment webhook return paid & approved payment
  if (status === "paid") {
    // change state to paid
    await updateOrderStatus(payment.invoice_id, PaymentState.PAID);
  } else {
    // change state to hold
    await updateOrderStatus(payment.invoice_id, PaymentState.HOLD);
  }
}

// payment
export async function moyasarPayment(payment: Moyasar): Promise<boolean> {
  // payment state
  try {
    // payment state
    await CheckPaymentState(payment);
  } catch (error) {
    // notify me on error
    await telegramAdmin(
      `shwerni-error: payment with moyasar faild for order with pid= ${payment.invoice_id}`,
    );
  }
  // return
  return true;
}
