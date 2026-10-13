import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentMethod, PaymentState, UserRole } from "@/lib/generated/prisma/enums";

// utils
import { dateTimeToString } from "@/utils/time";

// the payment of an order, as the dashboard mark-as-paid reads it
export async function getMarkPaidPayment(oid: number) {
  return prisma.payment.findUnique({
    where: { orderId: oid },
    select: { id: true, payment: true, method: true, pid: true },
  });
}

// the method (and the reference as pid, only when pid is empty: never overwritten), only while
// the payment is still in one of the given states. false when the state moved since the read.
// a reference that is already another payment's pid throws (a unique conflict)
export async function setMarkPaidMethod(input: {
  paymentId: string;
  states: PaymentState[];
  method: PaymentMethod;
  pid?: string;
}) {
  const result = await prisma.payment.updateMany({
    where: {
      id: input.paymentId,
      payment: { in: input.states },
      ...(input.pid ? { OR: [{ pid: null }, { pid: "" }] } : {}),
    },
    data: { method: input.method, ...(input.pid ? { pid: input.pid } : {}) },
  });
  return result.count > 0;
}

// the audit of a dashboard mark-as-paid: one line on the order's info and one FinanceLog row
export async function logMarkPaid(input: {
  oid: number;
  line: string;
  from: { payment: PaymentState; method: PaymentMethod | null; pid: string | null };
  to: { payment: PaymentState; method: PaymentMethod; pid: string | null };
  actor: { id: string; name: string; role: UserRole };
  note?: string;
}) {
  const changes = (["payment", "method", "pid"] as const)
    .filter((field) => input.from[field] !== input.to[field])
    .map((field) => ({ field, from: input.from[field], to: input.to[field] }));

  await prisma.$transaction([
    prisma.order.update({
      where: { oid: input.oid },
      data: {
        info: { push: `${input.line} | modified_at: ${dateTimeToString(new Date())}` },
      },
      select: { oid: true },
    }),
    prisma.financeLog.create({
      data: {
        entity: "ORDER",
        entityId: String(input.oid),
        orderId: input.oid,
        action: "APPROVE",
        changes,
        note: input.note ?? input.line,
        actorId: input.actor.id,
        actorName: input.actor.name,
        actorRole: input.actor.role,
      },
    }),
  ]);
}
