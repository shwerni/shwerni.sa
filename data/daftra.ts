import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";
import { DaftraDocType, DaftraSyncState } from "@/lib/generated/prisma/enums";

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

export async function getDaftraInvoiceOrder(
  oid: number,
): Promise<DaftraInvoiceOrder | null> {
  const order = await prisma.order.findUnique({
    where: { oid },
    select: { ...invoiceOrderSelect, reconciliation: { select: { id: true } } },
  });
  if (!order) return null;

  // the author's email, only for a real user account (guests are "temp")
  const author =
    order.author && order.author !== "temp"
      ? await prisma.user.findUnique({
          where: { id: order.author },
          select: { email: true },
        })
      : null;

  const { reconciliation, ...rest } = order;
  return {
    ...rest,
    authorEmail: author?.email?.trim() || null,
    reconciliation: !!reconciliation,
  };
}

// everything a refund receipt is built from
export async function getDaftraRefund(refundId: string) {
  return prisma.refund.findUnique({
    where: { id: refundId },
    select: {
      id: true,
      rfid: true,
      amount: true,
      reference: true,
      refundedAt: true,
      orderId: true,
      request: { select: { reason: true } },
    },
  });
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
  force?: boolean;
};

export type ClaimResult =
  | { claimed: true; id: string }
  | {
      claimed: false;
      status: "already_sent" | "already_claimed" | "review";
      row: NonNullable<DaftraDocumentRow> | null;
    };

// the claim rules: no row → create it PENDING; SENT → already_sent; PENDING → already_claimed;
// REVIEW → stop unless force; FAILED (or REVIEW with force) → back to PENDING with a conditional
// update on the state that was read, so of two callers only one wins
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
  if (existing.state === DaftraSyncState.REVIEW && !input.force)
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
