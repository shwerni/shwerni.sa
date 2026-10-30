import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { OrderType, PaymentState } from "@/lib/generated/prisma/enums";

// a riyadh calendar day ("YYYY-MM-DD"), `back` days before `now` (riyadh has no dst)
const riyadhDay = (now: number, back = 0) =>
  new Date(now + 3 * 3_600_000 - back * 86_400_000).toISOString().slice(0, 10);

/**
 * the consultant's latest PAID INSTANT orders with a meeting that isn't done, dated yesterday or
 * today (riyadh: a session that started before midnight can still be running), newest first.
 * whether a meeting has ended is decided by the caller (consultantBusyPayload)
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param now the current time in ms
 */
export const getOwnerInstantOrders = (cid: number, now: number = Date.now()) => {
  const days = [riyadhDay(now, 1), riyadhDay(now)];
  const meeting = { done: false, date: { in: days } };

  return prisma.order.findMany({
    where: {
      consultantId: cid,
      type: OrderType.INSTANT,
      payment: { payment: PaymentState.PAID },
      meeting: { some: meeting },
    },
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      oid: true,
      meeting: {
        where: meeting,
        select: { mid: true, date: true, time: true, duration: true },
      },
    },
  });
};
