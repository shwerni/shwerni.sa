import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// lib
import { freeSlotWhere } from "@/lib/booking/free-slot-where";

// utils
import { add25Minutes, dateToWeekDay, getDatesAhead } from "@/utils/date";

// constants
import { BOOKING_WINDOW_DAYS } from "@/constants/booking";

/**
 * is this a free slot the client can book now? the slot lists' own rule (one of the consultant's
 * weekly timings, freeSlotWhere) in the same window (BOOKING_WINDOW_DAYS from riyadh now + 25
 * minutes) as PayReconciliation's slot check and the website's date step (PickDateTime): a weekday
 * without timings, a past time or a taken slot fails. shared by the app's create route and the
 * package next-session pick
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
