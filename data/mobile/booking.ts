import "server-only";

// packages
import { randomUUID } from "node:crypto";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentMethod, PaymentState } from "@/lib/generated/prisma/enums";

// lib
import { freeSlotWhere } from "@/lib/booking/free-slot-where";

// utils
import { add25Minutes, dateToWeekDay, getDatesAhead } from "@/utils/date";

// constants
import {
  APP_UNPAID_ORDER_LIMIT,
  APP_UNPAID_WINDOW_MINUTES,
  BOOKING_WINDOW_DAYS,
  UNPAID_HOLD_MINUTES,
} from "@/constants/booking";

// the signed-in account's own phone (the block check runs on it, whatever the form sends)
export async function accountPhone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  return user?.phone ?? null;
}

// too many orders not PAID from this account in the last APP_UNPAID_WINDOW_MINUTES (any state but
// PAID: a cancelled or refused attempt still counts, so cancel + book again can't loop)
export async function unpaidOrderLimitReached(userId: string): Promise<boolean> {
  const count = await prisma.order.count({
    where: {
      author: userId,
      created_at: { gte: new Date(Date.now() - APP_UNPAID_WINDOW_MINUTES * 60_000) },
      payment: { is: { payment: { not: PaymentState.PAID } } },
    },
  });
  return count >= APP_UNPAID_ORDER_LIMIT;
}

/**
 * the client's own unpaid (NEW) orders still holding this slot (younger than UNPAID_HOLD_MINUTES):
 * by the session's account only, never a phone from the form. they don't block the client's new
 * booking of the same slot, and are cancelled once it's created
 * @param date yyyy-MM-dd (riyadh)
 * @param time HH:mm
 */
export async function ownUnpaidAtSlot(
  userId: string,
  cid: number,
  date: string,
  time: string,
): Promise<number[]> {
  const orders = await prisma.order.findMany({
    where: {
      author: userId,
      consultantId: cid,
      created_at: { gt: new Date(Date.now() - UNPAID_HOLD_MINUTES * 60_000) },
      payment: { is: { payment: PaymentState.NEW } },
      meeting: { some: { date, time } },
    },
    select: { oid: true },
  });
  return orders.map((order) => order.oid);
}

/**
 * is this a free slot the client can book now? the slot lists' own rule (one of the consultant's
 * weekly timings, freeSlotWhere) in the same window (BOOKING_WINDOW_DAYS from riyadh now + 25
 * minutes) as PayReconciliation's slot check: a weekday without timings, a past time or a taken
 * slot fails
 * @param date yyyy-MM-dd (riyadh)
 * @param time HH:mm
 * @param exceptOrders the client's own unpaid orders at this slot (ownUnpaidAtSlot)
 */
export async function isBookableSlot(
  cid: number,
  date: string,
  time: string,
  exceptOrders: number[] = [],
): Promise<boolean> {
  const lead = add25Minutes();
  if (!getDatesAhead(BOOKING_WINDOW_DAYS, lead.iso).includes(date)) return false;
  // the weekday of that calendar day, independent of the server's time zone
  const weekday = dateToWeekDay(new Date(`${date}T12:00:00Z`));
  const after = date === lead.date ? lead.time : null;
  const [row] = await prisma.$queryRaw<{ free: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM "consultant_timings" ct
      WHERE
        ct."consultantId" = ${cid}
        AND ct."day" = ${weekday}::"Weekday"
        AND ct."time" = ${time}${freeSlotWhere({ date, after, exceptOrders })}
    ) AS free
  `;
  return row?.free === true;
}

/**
 * cancel the client's older unpaid orders for the slot they just booked again (compare-and-set
 * on NEW, as the app's cancel route: an order paid meanwhile is left alone). app orders have no
 * pid before confirm, so this can't go through updateOrderStatus
 */
export async function cancelUnpaidOrders(oids: number[]): Promise<void> {
  if (oids.length === 0) return;
  await prisma.payment.updateMany({
    where: { orderId: { in: oids }, payment: PaymentState.NEW },
    data: { payment: PaymentState.CANCELED, cancelled_at: new Date() },
  });
}

// a package's session count (quoteBooking already checked it's active and the consultant's)
export async function packageSessionCount(id: string): Promise<number | null> {
  const pkg = await prisma.package.findUnique({ where: { id }, select: { count: true } });
  return pkg?.count ?? null;
}

/**
 * the app's wallet part on a new order's payment (Payment.wallet, sar): debited from the wallet
 * when the order turns PAID (orderStatusPaid → payPartiallyByWallet), never charged to the card.
 * whole = the wallet covers the full charge: the method becomes wallet and the payment gets its own
 * id, so it can go through updateOrderStatus at once
 * @returns the payment's pid when whole, else null
 */
export async function setAppWalletPart(
  paymentId: string,
  oid: number,
  amount: number,
  whole: boolean,
): Promise<string | null> {
  const pid = whole ? `wallet_${randomUUID()}` : null;
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      wallet: amount,
      ...(pid ? { pid, method: PaymentMethod.wallet } : {}),
      order: {
        update: {
          info: {
            push: `#${oid}'s info | ${whole ? "wallet payment" : "partially wallet payment"}: ${amount}`,
          },
        },
      },
    },
  });
  return pid;
}
