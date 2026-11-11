import "server-only";
// lib
import { capturePayment, tabbyPaymentDetails } from "@/lib/api/gatewaies/tabby";

// prisma data
import {
  getReservationPaymentByPid,
  updateOrderStatus,
} from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";
import { telegramAdmin } from "@/lib/api/telegram/telegram";
import {  getOrderForRefund, getWebhookActor, recordRefund } from "@/data/gatewaies/webhook";

// utils
import { acceptedChargeAmounts, withTax } from "@/utils/tax";

type TabbyDetails = NonNullable<Awaited<ReturnType<typeof tabbyPaymentDetails>>>;

// tabby's record already holds a capture of the whole amount (another caller captured it)
const capturedOnTabby = (details: TabbyDetails) =>
  (details.captures ?? []).reduce((sum, capture) => sum + Number(capture.amount), 0) >=
  Number(details.amount);

/**
 * an AUTHORIZED tabby payment: the one place it becomes PAID, for the tabby webhook and the app's
 * confirm (both may run for the same payment):
 * - the order already PAID → nothing (true)
 * - a wallet part (the app's booking never allows it with tabby) → HOLD + alert, no capture
 * - tabby's amount isn't this order's charge, or not SAR → HOLD + alert, no capture
 * - otherwise captured once: no capture when tabby's record already holds one (the other caller
 *   captured); a failed capture is re-checked on tabby's record before it counts as failed. then
 *   PAID through updateOrderStatus (its PAID claim runs the side effects once)
 * @param pid the tabby payment id (the order's pid)
 * @param details tabby's own record of the payment (tabbyPaymentDetails), status AUTHORIZED
 */
export async function settleAuthorizedTabby(
  pid: string,
  details: TabbyDetails,
): Promise<boolean> {
  const order = await getReservationPaymentByPid(pid);
  const payment = order?.payment;
  if (!payment) return false;

  // idempotent: tabby resends webhooks and the app may confirm too; a paid order is never changed
  if (payment.payment === PaymentState.PAID) return true;

  // a wallet part never goes with tabby: a person decides (HOLD), rather than charging tabby beside
  // a wallet debit at PAID
  if (payment.wallet && payment.wallet > 0) {
    await updateOrderStatus(pid, PaymentState.HOLD);
    await telegramAdmin(
      `shwerni-error: tabby payment=${pid} on an order with a wallet part (${payment.wallet} SAR), not captured, order set to hold`,
    );
    return false;
  }

  // capture only when tabby's amount matches what this order charged (the same calculation Pay
  // charges with). remove after 2026-10-09: pre-cutoff orders also accept the old formulas
  const expected = withTax(payment.total);
  const accepted = acceptedChargeAmounts(payment.total, order?.created_at);
  const amountMatches =
    accepted.includes(Number(details.amount)) && details.currency === "SAR";
  if (!amountMatches) {
    await updateOrderStatus(pid, PaymentState.HOLD);
    await telegramAdmin(
      `shwerni-error: tabby payment=${pid} amount ${details.amount} ${details.currency} does not match order total ${expected} SAR, order set to hold`,
    );
    return false;
  }

  // capture once
  if (!capturedOnTabby(details)) {
    const captured = await capturePayment(pid, details.amount);

    if (!captured) {
      // the other caller may have captured in between: tabby's own record decides
      const fresh = await tabbyPaymentDetails(pid);
      if (!fresh || !capturedOnTabby(fresh)) {
        // a parallel caller may have captured and paid already; never downgrade a paid order
        const current = await getReservationPaymentByPid(pid);
        if (current?.payment?.payment === PaymentState.PAID) return true;

        await updateOrderStatus(pid, PaymentState.HOLD);
        await telegramAdmin(
          `shwerni-error: tabby capture failed for payment=${pid}, order set to hold`,
        );
        return false;
      }
    }
  }

  // update order state
  try {
    // change state to paid
    await updateOrderStatus(pid, PaymentState.PAID);
  } catch {
    // if unsuccessful order
    await updateOrderStatus(pid, PaymentState.HOLD);
  }
  return true;
}

export async function tabbyRefundWebhook(pid: string): Promise<boolean> {
  try {
    // never trust the webhook body's refunds[] directly — re-verify server-to-server
    const payment = await tabbyPaymentDetails(pid);
    if (!payment) {
      await telegramAdmin(
        `shwerni-error: tabby refund webhook could not verify payment=${pid}`,
      );
      return false;
    }

    const totalRefundedSar = payment.refunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    // "closed" with nothing in refunds[] is a plain close/cancel, not a refund
    if (totalRefundedSar <= 0) return true;

    const order = await getOrderForRefund(pid);
    if (!order?.payment) {
      await telegramAdmin(
        `shwerni-error: tabby refund webhook — no order found for payment=${pid}`,
      );
      return false;
    }

    const actor = await getWebhookActor();
    if (!actor) {
      await telegramAdmin(
        `shwerni-error: tabby refund for payment=${pid} — no ADMIN user found to attribute it to`,
      );
      return false;
    }

    await recordRefund({
      orderOid: order.oid,
      paymentId: order.payment.id,
      totalRefundedSar: Math.round(totalRefundedSar * 100) / 100,
      reference: pid,
      pendingRequests: order.refundRequests,
      actor,
    });

    // treat a refund covering the full checkout amount as fully refunded —
    // Tabby's own status stays "closed" regardless, this is our own signal
    if (totalRefundedSar >= Number(payment.amount)) {
      await updateOrderStatus(pid, PaymentState.REFUND);
    }

    return true;
  } catch {
    await telegramAdmin(
      `shwerni-error: tabby refund handler failed for payment=${pid}`,
    );
    return false;
  }
}