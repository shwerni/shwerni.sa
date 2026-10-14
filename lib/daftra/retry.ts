import "server-only";

// prisma data
import {
  DAFTRA_MAX_ATTEMPTS,
  getDaftraDocument,
  getRetryInvoiceOrders,
  getRetryRefunds,
  markStuckDaftraDocuments,
} from "@/data/daftra";

// lib
import { getDaftraConfig } from "@/lib/daftra/config";
import { sendOrderInvoice } from "@/lib/daftra/invoice";
import { sendRefundReceipt } from "@/lib/daftra/refund";
import { riyadhDayStart, type DaftraSendResult } from "@/lib/daftra/format";

// prisma types
import { DaftraDocType, DaftraSyncState } from "@/lib/generated/prisma/enums";

// the daily daftra retry: documents the automatic send never made, or that FAILED under the
// attempt cap. REVIEW and SENT rows are never touched; PENDING rows stuck for an hour become
// REVIEW (the outcome is unknown, so never resent). one send at a time, and no new send starts
// after the deadline. documents keep their own dates (order.created_at, refund.refundedAt)

const MINUTE = 60_000;
// orders and refunds younger than this are left to the payment path
const SETTLE_MS = 30 * MINUTE;
// a PENDING row untouched for this long was stopped mid-send
const STUCK_MS = 60 * MINUTE;
const GAP_MS = 1_000;

const NEEDS_ATTENTION = new Set<DaftraSendResult["status"]>([
  "failed",
  "review",
  "client_not_ready",
  "invoice_not_ready",
  "not_eligible",
]);

type Task = {
  label: string;
  dedupeKey: string;
  run: () => Promise<DaftraSendResult>;
};

export type DaftraRetrySummary =
  | { state: "disabled" }
  | { state: "config_error"; missing: string[] }
  | {
      state: "done";
      sent: string[];
      failed: { label: string; reason: string }[];
      stuck: string[];
      capped: string[];
      remaining: number;
    };

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const invoiceLabel = (oid: number) => `invoice #${oid}`;
const refundLabel = (rfid: number, oid: number) => `refund rfid ${rfid} (#${oid})`;

export async function runDaftraRetry(deadline: number): Promise<DaftraRetrySummary> {
  const config = getDaftraConfig();
  if (!config.enabled) return { state: "disabled" };
  if (!config.ok) return { state: "config_error", missing: config.missing };

  const now = Date.now();

  // 1. stuck sends → REVIEW, for a person
  const stuckRows = await markStuckDaftraDocuments(new Date(now - STUCK_MS));
  const stuck = stuckRows.map((row) =>
    row.type === DaftraDocType.INVOICE || !row.refund
      ? invoiceLabel(row.orderId)
      : refundLabel(row.refund.rfid, row.orderId),
  );

  // 2. what to send: invoices first, so a refund finds its source invoice already in daftra
  const since = riyadhDayStart(config.startDate);
  const before = new Date(now - SETTLE_MS);
  const [oids, refunds] = await Promise.all([
    getRetryInvoiceOrders(since, before),
    getRetryRefunds(since, before),
  ]);

  const tasks: Task[] = [
    ...oids.map((oid) => ({
      label: invoiceLabel(oid),
      dedupeKey: `invoice:${oid}`,
      run: () => sendOrderInvoice(oid, { source: "cron", whatsapp: false }),
    })),
    ...refunds.map((refund) => ({
      label: refundLabel(refund.rfid, refund.orderId),
      dedupeKey: `refund:${refund.id}`,
      run: () => sendRefundReceipt(refund.id, { source: "cron" }),
    })),
  ];

  // 3. one at a time, until the deadline
  const sent: string[] = [];
  const failed: { label: string; reason: string }[] = [];
  const capped: string[] = [];
  let done = 0;

  for (const task of tasks) {
    if (Date.now() >= deadline) break;
    if (done > 0) await pause(GAP_MS);
    done++;

    let result: DaftraSendResult;
    try {
      result = await task.run();
    } catch (err) {
      console.error(
        `[daftra-retry] ${task.label} threw`,
        err instanceof Error ? err.name : "error",
      );
      failed.push({ label: task.label, reason: "unexpected error" });
      continue;
    }

    if (result.status === "sent") {
      sent.push(task.label);
      continue;
    }
    // already sent or claimed by another caller meanwhile: nothing happened here
    if (!NEEDS_ATTENTION.has(result.status)) continue;

    const row = await getDaftraDocument(task.dedupeKey).catch(() => null);
    const reason = (row?.lastError ?? result.message).replace(/\s+/g, " ").slice(0, 120);
    failed.push({ label: task.label, reason: `${result.status}: ${reason}` });
    if (row?.state === DaftraSyncState.FAILED && row.attempts >= DAFTRA_MAX_ATTEMPTS)
      capped.push(task.label);
  }

  return { state: "done", sent, failed, stuck, capped, remaining: tasks.length - done };
}

// the run's one telegram message, or null when nothing happened
export function daftraRetryMessage(summary: DaftraRetrySummary): string | null {
  if (summary.state === "disabled") return null;
  if (summary.state === "config_error")
    return `daftra retry: config incomplete (${summary.missing.join(", ")}), nothing sent`;

  const { sent, failed, stuck, capped, remaining } = summary;
  if (!sent.length && !failed.length && !stuck.length && !remaining) return null;

  // telegram caps a message at 4096 characters
  const list = (items: string[], max = 25) =>
    items.length > max
      ? [...items.slice(0, max), `+${items.length - max} more`]
      : items;

  const lines = [
    `daftra retry: ${sent.length} sent, ${failed.length} failed, ${stuck.length} stuck → REVIEW, ${remaining} left`,
  ];
  if (sent.length) lines.push(`sent: ${list(sent, 40).join(", ")}`);
  if (failed.length)
    lines.push("failed:", ...list(failed.map((f) => `- ${f.label}: ${f.reason}`)));
  if (stuck.length) lines.push(`stuck → REVIEW: ${list(stuck).join(", ")}`);
  if (capped.length)
    lines.push(`reached ${DAFTRA_MAX_ATTEMPTS} attempts (no more retries): ${list(capped).join(", ")}`);
  if (remaining) lines.push(`left for the next run: ${remaining}`);

  return lines.join("\n").slice(0, 4000);
}
