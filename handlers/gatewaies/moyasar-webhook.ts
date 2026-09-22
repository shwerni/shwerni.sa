// lib
import {
  moyasarInvoiceDetails,
  moyasarSettlementDetails,
} from "@/lib/api/gatewaies/moyasar";
import { PaymentState } from "@/lib/generated/prisma/enums";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// data
import { updateOrderStatus } from "@/data/order/reserveation";

import { UTApi } from "uploadthing/server";
import {
  getOrderForRefund,
  getWebhookActor,
  recordRefund,
  recordMoyasarSettlement,
} from "@/data/gatewaies/webhook";
const utapi = new UTApi();

// types
interface MoyasarSettlementEvent {
  id: string;
  currency: string;
  amount: number;
  fee: number;
  tax: number;
  transaction_count: number;
  created_at: string;
}

interface MoyasarRefundedPaymentEvent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  refunded: number;
  refunded_at: string | null;
  invoice_id: string;
}

// balance_transferred webhook
export async function moyasarSettlementWebhook(
  event: MoyasarSettlementEvent,
): Promise<boolean> {
  try {
    // never trust the webhook body's amount/urls directly — re-fetch server-to-server
    const settlement = await moyasarSettlementDetails(event.id);
    if (!settlement || !settlement.invoice_url) {
      await telegramAdmin(
        `shwerni-error: moyasar settlement ${event.id} could not be verified or has no invoice`,
      );
      return false;
    }

    const actor = await getWebhookActor();
    if (!actor) {
      await telegramAdmin(
        `shwerni-error: moyasar settlement ${event.id} — no ADMIN user found to attribute the ledger entry to`,
      );
      return false;
    }

    const uploaded = await utapi.uploadFilesFromUrl(settlement.invoice_url);
    if (!uploaded?.data) {
      await telegramAdmin(
        `shwerni-error: failed to upload invoice PDF for moyasar settlement ${event.id}`,
      );
      return false;
    }

    await recordMoyasarSettlement({
      settlementId: settlement.id,
      amountSar: Math.round((settlement.amount / 100) * 100) / 100,
      settlementDate: new Date(settlement.created_at),
      transactionCount: event.transaction_count,
      proof: {
        url: uploaded.data.url,
        key: uploaded.data.key,
        name: uploaded.data.name ?? `moyasar-settlement-${settlement.id}.pdf`,
      },
      actor,
    });

    return true;
  } catch {
    await telegramAdmin(
      `shwerni-error: moyasar settlement handler failed for settlement=${event.id}`,
    );
    return false;
  }
}

// payment_refunded webhook
export async function moyasarRefundWebhook(
  payment: MoyasarRefundedPaymentEvent,
): Promise<boolean> {
  try {
    // re-verify the specific payment against the invoice, never trust the webhook body alone
    const invoice = await moyasarInvoiceDetails(payment.invoice_id);
    const verified = invoice?.payments.find((p) => p.id === payment.id);
    if (!verified || verified.refunded <= 0) {
      await telegramAdmin(
        `shwerni-error: moyasar refund webhook could not be verified for payment=${payment.id}`,
      );
      return false;
    }

    const order = await getOrderForRefund(payment.invoice_id);
    if (!order?.payment) {
      await telegramAdmin(
        `shwerni-error: moyasar refund webhook — no order found for invoice=${payment.invoice_id}`,
      );
      return false;
    }

    const actor = await getWebhookActor();
    if (!actor) {
      await telegramAdmin(
        `shwerni-error: moyasar refund for invoice=${payment.invoice_id} — no ADMIN user found to attribute it to`,
      );
      return false;
    }

    await recordRefund({
      orderOid: order.oid,
      paymentId: order.payment.id,
      totalRefundedSar: Math.round((verified.refunded / 100) * 100) / 100,
      reference: payment.id,
      pendingRequests: order.refundRequests,
      actor,
    });

    // an invoice only reaches "refunded" status once fully refunded — a partial
    // refund leaves the invoice (and our PaymentState) at "paid"
    if (invoice?.status === "refunded") {
      await updateOrderStatus(payment.invoice_id, PaymentState.REFUND);
    }

    return true;
  } catch {
    await telegramAdmin(
      `shwerni-error: moyasar refund handler failed for payment=${payment.id}`,
    );
    return false;
  }
}
