import "server-only";

// prisma db
import prisma from "@/lib/database/db";
import { Prisma } from "@/lib/generated/prisma/client";

// prisma types
import { OrderType, PaymentState } from "@/lib/generated/prisma/enums";

// prisma data
import { ONLINE_LISTABLE, consultantBusyBetween } from "@/data/online-busy";

// lib
import { getRealtimeOnlineIds } from "@/lib/api/realtime/internal";

// utils
import { addNMinutes } from "@/utils/date";

// constants
import { INSTANT_DURATION, INSTANT_PAYMENT_WINDOW_MS } from "@/constants/instant";

// reserveInstant's own refusal messages (data/online.ts), so the quote and the booking agree
export const INSTANT_UNAVAILABLE = "هذا المستشار غير متاح حالياً";
export const INSTANT_BUSY = "هذا المستشار لديه حجز فوري الآن، برجاء اختيار مستشار آخر";

/**
 * could this client book this consultant instantly right now? a read-only preview of
 * reserveInstant's checks for the app's quote (reserveInstant, under its lock, stays the one that
 * decides at booking time): listable and online on the realtime server; no other client's open
 * instant order still inside its payment window; no PAID session during [now, the end of a new
 * session starting in 5 minutes]
 * @param cid the consultant
 * @param userId the session's user: their own open orders (by account or by the account's phone)
 * don't count, as reserveInstant cancels them when they book again
 * @returns null when bookable, else the message reserveInstant would give
 */
export async function instantAvailability(
  cid: number,
  userId: string,
): Promise<string | null> {
  const [onlineIds, account] = await Promise.all([
    getRealtimeOnlineIds().catch(() => [] as string[]),
    prisma.user.findUnique({ where: { id: userId }, select: { phone: true } }),
  ]);
  const own = { userId, phone: account?.phone ?? null };

  const [owner] = await prisma.$queryRaw<{ userId: string | null; name: string | null }[]>`
    SELECT c."userId", c.name FROM consultants c WHERE c.cid = ${cid} AND ${ONLINE_LISTABLE}`;
  if (!owner?.name || !owner.userId || !onlineIds.includes(owner.userId)) {
    return INSTANT_UNAVAILABLE;
  }

  const mine = own.phone
    ? Prisma.sql`(o.author = ${own.userId} OR o.phone = ${own.phone})`
    : Prisma.sql`o.author = ${own.userId}`;
  const windowSeconds = INSTANT_PAYMENT_WINDOW_MS / 1000;
  const others = await prisma.$queryRaw<unknown[]>`
    SELECT 1
    FROM orders o
    JOIN payments p ON p."orderId" = o.oid
    WHERE o."consultantId" = ${cid}
      AND o.type = ${OrderType.INSTANT}::"OrderType"
      AND p.payment IN (${PaymentState.NEW}::"PaymentState", ${PaymentState.PROCESSING}::"PaymentState")
      AND o.created_at > now() - make_interval(secs => ${windowSeconds}::double precision)
      AND NOT ${mine}
    LIMIT 1
  `;
  if (others.length > 0) return INSTANT_BUSY;

  const now = new Date();
  const slot = addNMinutes();
  const endsAt = new Date(
    new Date(`${slot.date}T${slot.time}:00+03:00`).getTime() + INSTANT_DURATION * 60_000,
  );
  const busy = await prisma.$queryRaw<unknown[]>`
    SELECT 1 FROM consultants c
    WHERE c.cid = ${cid}
      AND ${consultantBusyBetween(now, new Date(endsAt.getTime() - 1))}
  `;
  if (busy.length > 0) return INSTANT_BUSY;

  return null;
}
