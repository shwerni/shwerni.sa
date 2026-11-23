import "server-only";

// packages
import { randomUUID } from "node:crypto";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { OrderType, PaymentMethod, PaymentState } from "@/lib/generated/prisma/enums";

// constants
import { INSTANT_LIMIT_PER_PHONE, INSTANT_LIMIT_WINDOW_MS } from "@/constants/instant";
import {
  APP_UNPAID_ORDER_LIMIT,
  APP_UNPAID_WINDOW_MINUTES,
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

// the app's instant limit: the website's INSTANT_LIMIT_PER_PHONE instant orders per phone in
// INSTANT_LIMIT_WINDOW_MS (the form's phone), plus the same per account; no ip limit (mobile
// networks share ips). every created instant order counts, as on the website
export async function instantLimitReached(userId: string, phone: string): Promise<boolean> {
  const since = new Date(Date.now() - INSTANT_LIMIT_WINDOW_MS);
  const [byPhone, byAccount] = await Promise.all([
    prisma.order.count({ where: { type: OrderType.INSTANT, phone, created_at: { gt: since } } }),
    prisma.order.count({ where: { type: OrderType.INSTANT, author: userId, created_at: { gt: since } } }),
  ]);
  return byPhone >= INSTANT_LIMIT_PER_PHONE || byAccount >= INSTANT_LIMIT_PER_PHONE;
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
