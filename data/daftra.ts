import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";
import { DaftraDocType, DaftraSyncState, PaymentState } from "@/lib/generated/prisma/enums";

// every database step of the daftra sync. the rows here are the only duplicate guard: daftra
// creates a second invoice for the same body sent twice

const isUniqueConflict = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

// ---------- loading ----------

// everything an order invoice is built from
const invoiceOrderSelect = {
  oid: true,
  name: true,
  phone: true,
  author: true,
  type: true,
  gift: true,
  sessionCount: true,
  programId: true,
  packageId: true,
  scaleId: true,
  origin: true,
  created_at: true,
  consultant: { select: { name: true, category: true } },
  center: { select: { name: true } },
  program: { select: { title: true } },
  package: { select: { count: true } },
  pleading: { select: { plid: true } },
  meeting: {
    orderBy: { session: "asc" },
    select: { session: true, date: true, time: true, duration: true },
  },
  payment: {
    select: {
      id: true,
      pid: true,
      total: true,
      tax: true,
      payment: true,
      method: true,
      wallet: true,
      usedCoupon: { select: { code: true, discount: true } },
    },
  },
} satisfies Prisma.OrderSelect;

export type DaftraInvoiceOrder = Prisma.OrderGetPayload<{
  select: typeof invoiceOrderSelect;
}> & { authorEmail: string | null; reconciliation: boolean };

// the author's email, only for a real user account (guests are "temp")
async function authorEmailOf(author: string | null) {
  if (!author || author === "temp") return null;
  const user = await prisma.user.findUnique({
    where: { id: author },
    select: { email: true },
  });
  return user?.email?.trim() || null;
}

export async function getDaftraInvoiceOrder(
  oid: number,
): Promise<DaftraInvoiceOrder | null> {
  const order = await prisma.order.findUnique({
    where: { oid },
    select: { ...invoiceOrderSelect, reconciliation: { select: { id: true } } },
  });
  if (!order) return null;

  const { reconciliation, ...rest } = order;
  return {
    ...rest,
    authorEmail: await authorEmailOf(order.author),
    reconciliation: !!reconciliation,
  };
}

// everything a refund receipt is built from
export async function getDaftraRefund(refundId: string) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    select: {
      id: true,
      rfid: true,
      amount: true,
      reference: true,
      refundedAt: true,
      orderId: true,
      order: { select: { created_at: true, author: true } },
      request: { select: { reason: true } },
    },
  });
  if (!refund) return null;
  return { ...refund, authorEmail: await authorEmailOf(refund.order.author) };
}

// ---------- the daily retry (cron) ----------

// a FAILED row is retried by the cron until it has this many attempts; then a person decides
export const DAFTRA_MAX_ATTEMPTS = 5;

// the documents the cron retries: never sent (no row), or FAILED under the attempt cap. never
// SENT, PENDING or REVIEW rows
const retryableRow = {
  state: DaftraSyncState.FAILED,
  attempts: { lt: DAFTRA_MAX_ATTEMPTS },
} satisfies Prisma.DaftraInvoiceWhereInput;

// PAID orders created between the go-live instant and the cutoff whose invoice is missing or
// retryable, oldest first
export async function getRetryInvoiceOrders(since: Date, before: Date) {
  const rows = await prisma.order.findMany({
    where: {
      created_at: { gte: since, lte: before },
      payment: { is: { payment: PaymentState.PAID } },
      OR: [
        { daftraInvoices: { none: { type: DaftraDocType.INVOICE } } },
        { daftraInvoices: { some: { type: DaftraDocType.INVOICE, ...retryableRow } } },
      ],
    },
    orderBy: { oid: "asc" },
    select: { oid: true },
  });
  return rows.map((row) => row.oid);
}

// Refund rows created before the cutoff, on orders created since the go-live instant, whose
// refund receipt is missing or retryable, oldest first
export async function getRetryRefunds(since: Date, before: Date) {
  return prisma.refund.findMany({
    where: {
      createdAt: { lte: before },
      order: { created_at: { gte: since } },
      OR: [{ daftraInvoice: null }, { daftraInvoice: { is: retryableRow } }],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, rfid: true, orderId: true },
  });
}

// PENDING rows untouched since `before` were stopped mid-send: the outcome is unknown, so they
// become REVIEW (never resent automatically). conditional per row, so a send that finishes
// meanwhile keeps its own outcome. returns the rows that were moved
export async function markStuckDaftraDocuments(before: Date) {
  const rows = await prisma.daftraInvoice.findMany({
    where: { state: DaftraSyncState.PENDING, updatedAt: { lt: before } },
    select: { id: true, type: true, orderId: true, refund: { select: { rfid: true } } },
    orderBy: { createdAt: "asc" },
  });

  const moved: typeof rows = [];
  for (const row of rows) {
    const { count } = await prisma.daftraInvoice.updateMany({
      where: { id: row.id, state: DaftraSyncState.PENDING, updatedAt: { lt: before } },
      data: { state: DaftraSyncState.REVIEW, lastError: "stuck in PENDING" },
    });
    if (count) moved.push(row);
  }
  return moved;
}

// ---------- customers ----------

export async function getDaftraClientByPhone(phone: string) {
  return prisma.daftraClient.findUnique({ where: { phone } });
}

// claims the customer's row before the create call. "claimed" means this caller creates the
// daftra client; "exists" returns the row another caller made (its id may still be null)
export async function claimDaftraClient(phone: string, name: string) {
  try {
    await prisma.daftraClient.create({
      data: { phone, name, daftraClientId: null },
    });
    return { claimed: true as const };
  } catch (err) {
    if (!isUniqueConflict(err)) throw err;
    return {
      claimed: false as const,
      row: await prisma.daftraClient.findUnique({ where: { phone } }),
    };
  }
}

export async function setDaftraClientId(phone: string, daftraClientId: number) {
  await prisma.daftraClient.update({
    where: { phone },
    data: { daftraClientId },
  });
}

// a failed create frees the claim, so a later attempt can retry (only while it has no id)
export async function releaseDaftraClientClaim(phone: string) {
  await prisma.daftraClient.deleteMany({
    where: { phone, daftraClientId: null },
  });
}

// ---------- documents ----------

export type DaftraDocumentRow = Awaited<
  ReturnType<typeof prisma.daftraInvoice.findUnique>
>;

export async function getDaftraDocument(dedupeKey: string) {
  return prisma.daftraInvoice.findUnique({ where: { dedupeKey } });
}

export async function getOrderInvoiceDocument(oid: number) {
  return getDaftraDocument(`invoice:${oid}`);
}

type ClaimInput = {
  dedupeKey: string;
  type: DaftraDocType;
  orderId: number;
  refundId?: string | null;
  amount: number;
  tax: number;
  method: string;
  source: string;
};

export type ClaimResult =
  | { claimed: true; id: string }
  | {
      claimed: false;
      status: "already_sent" | "already_claimed" | "review";
      row: NonNullable<DaftraDocumentRow> | null;
    };

// the claim rules: no row → create it PENDING; SENT → already_sent; PENDING → already_claimed;
// REVIEW → review (never re-sent: settled with /api/dashboard/daftra/resolve); FAILED → back to
// PENDING with a conditional update on the state that was read, so of two callers only one wins
export async function claimDaftraDocument(input: ClaimInput): Promise<ClaimResult> {
  const fields = {
    amount: input.amount,
    tax: input.tax,
    method: input.method,
    source: input.source,
  };

  const existing = await getDaftraDocument(input.dedupeKey);

  if (!existing) {
    try {
      const row = await prisma.daftraInvoice.create({
        data: {
          dedupeKey: input.dedupeKey,
          type: input.type,
          state: DaftraSyncState.PENDING,
          orderId: input.orderId,
          refundId: input.refundId ?? null,
          attempts: 1,
          ...fields,
        },
        select: { id: true },
      });
      return { claimed: true, id: row.id };
    } catch (err) {
      if (!isUniqueConflict(err)) throw err;
      return { claimed: false, status: "already_claimed", row: null };
    }
  }

  if (existing.state === DaftraSyncState.SENT)
    return { claimed: false, status: "already_sent", row: existing };
  if (existing.state === DaftraSyncState.PENDING)
    return { claimed: false, status: "already_claimed", row: existing };
  if (existing.state === DaftraSyncState.REVIEW)
    return { claimed: false, status: "review", row: existing };

  const { count } = await prisma.daftraInvoice.updateMany({
    where: { id: existing.id, state: existing.state },
    data: {
      state: DaftraSyncState.PENDING,
      attempts: { increment: 1 },
      lastError: null,
      ...fields,
    },
  });
  return count === 1
    ? { claimed: true, id: existing.id }
    : { claimed: false, status: "already_claimed", row: existing };
}

// the claimer's outcome: SENT (created in daftra), FAILED (definitive, retriable) or REVIEW
// (unknown outcome, daftra may have created it)
export async function finishDaftraDocument(
  id: string,
  outcome:
    | {
        state: typeof DaftraSyncState.SENT;
        daftraId: number;
        daftraNo: string | null;
        daftraClientId: number | null;
        daftraParent?: number | null;
        payload: unknown;
        response: unknown;
      }
    | {
        state: typeof DaftraSyncState.FAILED | typeof DaftraSyncState.REVIEW;
        error: string;
        daftraClientId?: number | null;
        daftraParent?: number | null;
        payload?: unknown;
        response?: unknown;
      },
) {
  const json = (v: unknown) =>
    v === undefined || v === null ? Prisma.DbNull : (v as Prisma.InputJsonValue);

  if (outcome.state === DaftraSyncState.SENT) {
    await prisma.daftraInvoice.update({
      where: { id },
      data: {
        state: DaftraSyncState.SENT,
        daftraId: outcome.daftraId,
        daftraNo: outcome.daftraNo,
        daftraClientId: outcome.daftraClientId,
        daftraParent: outcome.daftraParent ?? null,
        payload: json(outcome.payload),
        response: json(outcome.response),
        lastError: null,
        sentAt: new Date(),
      },
    });
    return;
  }

  await prisma.daftraInvoice.update({
    where: { id },
    data: {
      state: outcome.state,
      lastError: outcome.error,
      ...(outcome.daftraClientId !== undefined && {
        daftraClientId: outcome.daftraClientId,
      }),
      ...(outcome.daftraParent !== undefined && {
        daftraParent: outcome.daftraParent,
      }),
      ...(outcome.payload !== undefined && { payload: json(outcome.payload) }),
      ...(outcome.response !== undefined && { response: json(outcome.response) }),
    },
  });
}

// ---------- settling a REVIEW row (the dashboard) ----------

export type SettleOutcome = "settled" | "not_review" | "duplicate";

// a person settled a REVIEW row after checking daftra: it is there (SENT, with daftra's id and
// number, the GET body as the last response, the parent invoice for a refund receipt) or it isn't
// (FAILED, so a normal send or the nightly retry sends it). conditional on REVIEW, so of two
// settles only one wins. a daftraId another row already holds is a duplicate, nothing changes
export async function settleReviewDocument(
  id: string,
  outcome:
    | {
        state: typeof DaftraSyncState.SENT;
        daftraId: number;
        daftraNo: string | null;
        daftraParent?: number | null;
        response: unknown;
      }
    | { state: typeof DaftraSyncState.FAILED; note: string },
): Promise<SettleOutcome> {
  try {
    const { count } = await prisma.daftraInvoice.updateMany({
      where: { id, state: DaftraSyncState.REVIEW },
      data:
        outcome.state === DaftraSyncState.SENT
          ? {
              state: DaftraSyncState.SENT,
              daftraId: outcome.daftraId,
              daftraNo: outcome.daftraNo,
              ...(outcome.daftraParent && { daftraParent: outcome.daftraParent }),
              response:
                outcome.response === undefined || outcome.response === null
                  ? Prisma.DbNull
                  : (outcome.response as Prisma.InputJsonValue),
              lastError: null,
              sentAt: new Date(),
            }
          : { state: DaftraSyncState.FAILED, lastError: outcome.note },
    });
    return count === 1 ? "settled" : "not_review";
  } catch (err) {
    if (isUniqueConflict(err)) return "duplicate";
    throw err;
  }
}

// the refund guard: what the order's other refund receipts already take (SENT, PENDING or REVIEW)
export async function sumOtherActiveRefunds(oid: number, exceptRefundId: string) {
  const { _sum } = await prisma.daftraInvoice.aggregate({
    where: {
      orderId: oid,
      type: DaftraDocType.REFUND,
      state: {
        in: [DaftraSyncState.SENT, DaftraSyncState.PENDING, DaftraSyncState.REVIEW],
      },
      NOT: { refundId: exceptRefundId },
    },
    _sum: { amount: true },
  });
  return _sum.amount ?? 0;
}

// ---------- invoice pdf on whatsapp ----------

// the order's invoice row for the pdf delivery, with the order's phone
export async function getInvoiceDelivery(oid: number) {
  return prisma.daftraInvoice.findUnique({
    where: { dedupeKey: `invoice:${oid}` },
    select: {
      id: true,
      state: true,
      daftraId: true,
      daftraNo: true,
      htmlUrl: true,
      whatsappSentAt: true,
      order: { select: { oid: true, phone: true } },
    },
  });
}

// daftra's two invoice links, read once after the invoice is SENT. htmlUrl (the hash preview
// link) is how the pdf is fetched on the server; it is never sent anywhere or logged
export async function saveInvoiceLinks(
  id: string,
  links: { pdfUrl: string | null; htmlUrl: string },
) {
  await prisma.daftraInvoice.update({
    where: { id },
    data: { htmlUrl: links.htmlUrl, ...(links.pdfUrl && { pdfUrl: links.pdfUrl }) },
  });
}

// claims the whatsapp send before it happens: only when it was never sent (whatsappSentAt null),
// or always on a dashboard resend. false → someone else sent or is sending it: skip
export async function claimInvoiceWhatsapp(id: string, resend: boolean) {
  const { count } = await prisma.daftraInvoice.updateMany({
    where: resend ? { id } : { id, whatsappSentAt: null },
    data: { whatsappSentAt: new Date() },
  });
  return count === 1;
}

// a failed send gives the claim back (resend: the earlier successful time is restored)
export async function releaseInvoiceWhatsapp(id: string, previous: Date | null) {
  await prisma.daftraInvoice.update({
    where: { id },
    data: { whatsappSentAt: previous },
  });
}
