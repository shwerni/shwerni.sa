import "server-only";

// prisma db
import prisma from "@/lib/database/db";
import { Prisma } from "@/lib/generated/prisma/client";

// booking
import { freeSlotWhere } from "@/lib/booking/free-slot-where";
import { BOOKING_LEAD_MINUTES, BOOKING_WINDOW_DAYS } from "@/constants/booking";

// a consultant's earliest free slot, or null when none in the booking window
export interface NextSlot {
  cid: number;
  date: string | null; // yyyy-MM-dd
  time: string | null; // HH:mm
}

/**
 * one query for a whole list: each consultant's earliest free slot from riyadh now +
 * BOOKING_LEAD_MINUTES over BOOKING_WINDOW_DAYS, from their weekly timings, using the
 * same free-slot rule as the times route (freeSlotWhere). LIMIT 1 per consultant stops
 * at the first free slot
 * @param cids consultant ids (already validated and capped by the caller)
 */
export const nextSlotsQuery = (cids: number[]) => Prisma.sql`
  WITH lead AS (
    SELECT (now() AT TIME ZONE 'Asia/Riyadh') + make_interval(mins => ${BOOKING_LEAD_MINUTES}) AS t
  ),
  days AS (
    SELECT (l.t::date + g) AS d, l.t
    FROM lead l, generate_series(0, ${BOOKING_WINDOW_DAYS - 1}) g
  )
  SELECT c.cid, s.date, s.time
  FROM unnest(${cids}::int[]) AS c(cid)
  LEFT JOIN LATERAL (
    SELECT to_char(dd.d, 'YYYY-MM-DD') AS date, ct."time" AS time
    FROM days dd
    JOIN "consultant_timings" ct
      ON ct."consultantId" = c.cid
      AND ct."day" = to_char(dd.d, 'FMDAY')::"Weekday"
    WHERE true${freeSlotWhere({
      date: Prisma.sql`to_char(dd.d, 'YYYY-MM-DD')`,
      after: Prisma.sql`(CASE WHEN dd.d = dd.t::date THEN to_char(dd.t, 'HH24:MI') END)`,
    })}
    ORDER BY dd.d, ct."time"::time
    LIMIT 1
  ) s ON true
`;

/**
 * earliest free slot per consultant, in the order of cids
 * @param cids consultant ids
 */
export const getNextSlots = async (cids: number[]): Promise<NextSlot[]> => {
  if (cids.length === 0) return [];
  return prisma.$queryRaw<NextSlot[]>(nextSlotsQuery(cids));
};
