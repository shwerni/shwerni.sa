"use server";
// lib
import { capturePayment, tabbyPaymentDetails } from "@/lib/api/gatewaies/tabby";

// prisma data
import { updateOrderStatus } from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";
import { telegramAdmin } from "@/lib/api/telegram/telegram";
import {  getOrderForRefund, getWebhookActor, recordRefund } from "@/data/gatewaies/webhook";

// payment state update
export async function tabbyPayment(pid: string, amount: string) {
  // capture payment
  await capturePayment(pid, amount);
  // update order state
  try {
    // change state to paid
    await updateOrderStatus(pid, PaymentState.PAID);
  } catch {
    // if unsuccessful order
    await updateOrderStatus(pid, PaymentState.HOLD);
  }
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