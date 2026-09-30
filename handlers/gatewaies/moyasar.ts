import "server-only";
// prisma data
import {
  getReservationPaymentByPid,
  updateOrderStatus,
} from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// lib
import { telegramAdmin } from "@/lib/api/telegram/telegram";
import { moyasarInvoiceDetails } from "@/lib/api/gatewaies/moyasar";

// utils
import { orderChargeTotal } from "@/utils/admin/payments";
import { isMoyasarDefinitiveFailure, type Status } from "@/utils/gatewaies";

// types: only invoice_id is read, everything else in the body is ignored
interface Moyasar {
  invoice_id: string;
}

// payment state update: every decision uses moyasar's own invoice, never the body
async function CheckPaymentState(payment: Moyasar) {
  // invoice id (the order's pid)
  const pid = payment.invoice_id;

  // get order by payment id
  const order = await getReservationPaymentByPid(pid);

  // order payment
  const orderPayment = order?.payment;

  // unknown invoice: nothing to change
  if (!orderPayment?.payment) return;

  // idempotent: a paid order is never changed by a (re)sent callback
  if (orderPayment.payment === PaymentState.PAID) return;

  // re-fetch the full invoice server-to-server
  const invoice = await moyasarInvoiceDetails(pid);

  // unverifiable: change nothing, tell an admin
  if (!invoice) {
    await telegramAdmin(
      `shwerni-error: moyasar callback could not verify invoice=${pid}`,
    );
    return;
  }

  // paid: only when amount (halalas), currency and invoice all match this order
  if (invoice.status === "paid") {
    const expected = Math.round(orderChargeTotal(orderPayment) * 100);
    const matches =
      invoice.amount === expected &&
      invoice.currency === "SAR" &&
      invoice.id === orderPayment.pid;

    if (matches) {
      // change state to paid
      await updateOrderStatus(pid, PaymentState.PAID);
    } else {
      // change state to hold
      await updateOrderStatus(pid, PaymentState.HOLD);
      await telegramAdmin(
        `shwerni-error: moyasar invoice=${pid} paid ${invoice.amount} ${invoice.currency}, expected ${expected} SAR, order set to hold`,
      );
    }
    return;
  }

  // definitive failures only; initiated and other in-progress statuses change nothing
  if (isMoyasarDefinitiveFailure(invoice.status as Status)) {
    // change state to hold
    await updateOrderStatus(pid, PaymentState.HOLD);
  }
}

// payment
export async function moyasarPayment(payment: Moyasar): Promise<boolean> {
  // payment state
  try {
    // payment state
    await CheckPaymentState(payment);
  } catch {
    // notify me on error
    await telegramAdmin(
      `shwerni-error: payment with moyasar faild for order with pid= ${payment.invoice_id}`,
    );
  }
  // return
  return true;
}

