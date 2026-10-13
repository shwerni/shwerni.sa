import "server-only";

// React & Next
import { after } from "next/server";

// prisma data
import { getDaftraDocument } from "@/data/daftra";

// lib
import { telegramAdmin } from "@/lib/api/telegram/telegram";
import { sendOrderInvoice } from "@/lib/daftra/invoice";
import { sendRefundReceipt } from "@/lib/daftra/refund";
import type { DaftraSendResult } from "@/lib/daftra/format";

// the automatic daftra sends (after a payment, after a refund row). they run after the response
// (next's after(), like the whatsapp webhook), so a slow daftra call never delays a payment
// webhook, and they never throw into the caller. outside a request scope they run in the background

// results that need a person: the document isn't in daftra and won't get there by itself
const NEEDS_ATTENTION = new Set<DaftraSendResult["status"]>([
  "failed",
  "review",
  "client_not_ready",
  "invoice_not_ready",
]);

const schedule = (task: () => Promise<void>) => {
  const run = () => task().catch(() => {});
  try {
    after(run);
  } catch {
    void run();
  }
};

// the admin alert: the order or refund number, the status and the short reason from the row
async function alert(label: string, dedupeKey: string, result: DaftraSendResult) {
  if (!NEEDS_ATTENTION.has(result.status)) return;

  const row = await getDaftraDocument(dedupeKey).catch(() => null);
  const reason = (row?.lastError ?? result.message).slice(0, 300);

  console.error(`[daftra] ${label} status=${result.status} reason=${reason}`);
  await telegramAdmin(`daftra: ${label} ${result.status} | ${reason}`);
}

// after onPaymentSuccess: the order's invoice. whatsapp: false skips the pdf on whatsapp
export function queueOrderInvoice(oid: number, options: { whatsapp?: boolean } = {}) {
  schedule(async () => {
    try {
      const result = await sendOrderInvoice(oid, {
        source: "payment",
        whatsapp: options.whatsapp,
      });
      await alert(`invoice oid=${oid}`, `invoice:${oid}`, result);
    } catch (err) {
      console.error(`[daftra] invoice oid=${oid} threw`, err instanceof Error ? err.name : "error");
      await telegramAdmin(`daftra: invoice oid=${oid} error | unexpected`);
    }
  });
}

// after a Refund row is created: its refund receipt
export function queueRefundReceipt(refundId: string, rfid: number) {
  schedule(async () => {
    try {
      const result = await sendRefundReceipt(refundId, { source: "payment" });
      await alert(`refund rfid=${rfid}`, `refund:${refundId}`, result);
    } catch (err) {
      console.error(`[daftra] refund rfid=${rfid} threw`, err instanceof Error ? err.name : "error");
      await telegramAdmin(`daftra: refund rfid=${rfid} error | unexpected`);
    }
  });
}
