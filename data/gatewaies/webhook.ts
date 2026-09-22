"use server";
import prisma from "@/lib/database/db";
import type { RefundChannel } from "@/lib/generated/prisma/enums";

// order + payment + any still-open refund request, keyed by the Moyasar invoice id —
// used by the payment_refunded webhook to attribute the refund correctly
export const getOrderForRefund = async (invoiceId: string) => {
  try {
    return await prisma.order.findFirst({
      where: { payment: { pid: invoiceId } },
      select: {
        oid: true,
        payment: { select: { id: true, pid: true, total: true, paid: true } },
        refundRequests: {
          where: { state: "PENDING" },
          select: { id: true, amount: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch {
    return null;
  }
};

// there is currently exactly one ADMIN user — automated (webhook-originated)
// finance and refund records are attributed to them, since every actor field
// on FinanceEntry/FinanceLog/Refund/RefundRequest is required (non-null)
export async function getWebhookActor() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true, role: true },
  });
  if (!admin) return null;
  return { id: admin.id, name: admin.name ?? "Admin", role: admin.role };
}

type UploadedProof = { url: string; key: string; name: string };

// idempotent: if we've already logged this settlement (webhook retry / redelivery),
// do nothing rather than double-upload the PDF and double-post the ledger entry
export async function recordMoyasarSettlement(params: {
  settlementId: string;
  amountSar: number;
  settlementDate: Date;
  transactionCount: number;
  proof: UploadedProof;
  actor: { id: string; name: string; role: string };
}) {
  const {
    settlementId,
    amountSar,
    settlementDate,
    transactionCount,
    proof,
    actor,
  } = params;
  const marker = `[moyasar-settlement:${settlementId}]`;

  const existing = await prisma.financeEntry.findFirst({
    where: { description: { contains: marker } },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const entry = await tx.financeEntry.create({
      data: {
        type: "INCOME",
        category: "GATEWAY_PAYOUT",
        title: "دفعة من ميسير",
        description: `${marker} ${transactionCount} transaction(s) settled`,
        amount: amountSar,
        date: settlementDate,
        proofUrl: proof.url,
        proofKey: proof.key,
        proofName: proof.name,
        createdById: actor.id,
        createdByName: actor.name,
        createdByRole: actor.role as never,
      },
      select: { id: true },
    });

    await tx.financeLog.create({
      data: {
        entity: "ENTRY",
        entityId: entry.id,
        action: "CREATE",
        changes: [{ field: "amount", from: null, to: amountSar }],
        note: `Auto-created from Moyasar balance_transferred webhook (settlement ${settlementId})`,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role as never,
      },
    });

    return entry;
  });
}

// idempotent via a diff against amounts already recorded for this paymentId —
// safe against Moyasar's up-to-6x webhook redelivery and against genuine
// sequential partial refunds on the same payment
export async function recordRefund(params: {
  orderOid: number;
  paymentId: string;
  totalRefundedSar: number; // cumulative refunded amount reported by Moyasar, in SAR
  reference: string; // Moyasar payment id
  pendingRequests: { id: string; amount: number }[];
  actor: { id: string; name: string; role: string };
}) {
  const {
    orderOid,
    paymentId,
    totalRefundedSar,
    reference,
    pendingRequests,
    actor,
  } = params;

  return prisma.$transaction(async (tx) => {
    const already = await tx.refund.aggregate({
      where: { paymentId },
      _sum: { amount: true },
    });
    const alreadyRefundedSar = already._sum.amount ?? 0;
    const incrementSar =
      Math.round((totalRefundedSar - alreadyRefundedSar) * 100) / 100;

    // nothing new — this delivery is a retry/duplicate, or we already saw a larger figure
    if (incrementSar <= 0) return null;

    const matchedRequest = pendingRequests.find(
      (r) => Math.abs(r.amount - incrementSar) < 0.01,
    );

    const refund = await tx.refund.create({
      data: {
        amount: incrementSar,
        channel: "GATEWAY" as RefundChannel,
        reference,
        note: matchedRequest
          ? "Auto-recorded from Moyasar payment_refunded webhook, matched to refund request"
          : "Auto-recorded from Moyasar payment_refunded webhook — no matching refund request found (manual refund)",
        refundedById: actor.id,
        refundedByName: actor.name,
        refundedByRole: actor.role as never,
        orderId: orderOid,
        paymentId,
        requestId: matchedRequest?.id ?? null,
      },
      select: { id: true },
    });

    await tx.financeLog.create({
      data: {
        entity: "REFUND",
        entityId: refund.id,
        action: "PROCESS",
        changes: [{ field: "amount", from: null, to: incrementSar }],
        note: `Auto-recorded from Moyasar payment_refunded webhook (payment ${reference})`,
        orderId: orderOid,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role as never,
      },
    });

    if (matchedRequest) {
      await tx.refundRequest.update({
        where: { id: matchedRequest.id },
        data: {
          state: "REFUNDED",
          reviewedById: actor.id,
          reviewedByName: actor.name,
          reviewedByRole: actor.role as never,
          reviewedAt: new Date(),
          reviewNote: "Auto-confirmed: matching refund detected on Moyasar",
        },
      });

      await tx.financeLog.create({
        data: {
          entity: "REFUND_REQUEST",
          entityId: matchedRequest.id,
          action: "APPROVE",
          changes: [{ field: "state", from: "PENDING", to: "REFUNDED" }],
          note: "Auto-approved: Moyasar webhook confirmed the refund",
          orderId: orderOid,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role as never,
        },
      });
    }

    return refund;
  });
}
