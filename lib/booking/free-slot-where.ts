// prisma
import { Prisma } from "@/lib/generated/prisma/client";
import { PaymentState } from "@/lib/generated/prisma/enums";

// constants
import { UNPAID_HOLD_MINUTES } from "@/constants/booking";

// how close two session starts may be: a booking can't start within this many minutes of
// another one (the same rule for the slot lists and checkMeetingTimeConflict)
export const CONFLICT_WINDOW_MINUTES = 30;

/**
 * true when a stored start (a meeting's or a free session's "yyyy-MM-dd" date and "HH:mm" time) is
 * within CONFLICT_WINDOW_MINUTES of a candidate start, compared as real date-times so it works
 * across midnight (23:30 on one day and 00:00 on the next are 30 minutes apart; 00:00 and 23:30 of
 * the same day are not). only the candidate's day and the days before and after are read. a
 * malformed stored row falls back to an exact date-and-time match
 * @param candidate the start being checked: its date and time, values or sql expressions
 * @param row the stored row's date and time columns
 */
export const startsNear = (
  candidate: { date: string | Prisma.Sql; time: string | Prisma.Sql },
  row: { date: Prisma.Sql; time: Prisma.Sql },
) => Prisma.sql`(
  ${row.date} IN (
    to_char((${candidate.date})::date - 1, 'YYYY-MM-DD'),
    (${candidate.date})::text,
    to_char((${candidate.date})::date + 1, 'YYYY-MM-DD')
  )
  AND CASE
    WHEN ${row.date} ~ '^\\d{4}-\\d{2}-\\d{2}$' AND ${row.time} ~ '^\\d{2}:\\d{2}$'
    THEN abs(extract(epoch FROM (
      (${row.date} || ' ' || ${row.time})::timestamp
      - ((${candidate.date})::text || ' ' || (${candidate.time})::text)::timestamp
    ))) <= ${CONFLICT_WINDOW_MINUTES * 60}
    ELSE ${row.date} = (${candidate.date})::text AND ${row.time} = (${candidate.time})::text
  END
)`;

/**
 * the single rule for "this weekly timing ct is a free slot on this date", appended to a
 * WHERE on "consultant_timings" ct: after the same-day cutoff, and no paid meeting, no new /
 * processing meeting younger than UNPAID_HOLD_MINUTES, and no free session starting within
 * CONFLICT_WINDOW_MINUTES of it (the rule checkMeetingTimeConflict enforces at booking time, so a
 * listed slot is never refused unless it was just taken). getConsultantAvailableTimes (times route,
 * website date steps, the package next-session page), isBookableSlot and the mobile next-slots
 * query all use it, so a card can never show a slot the booking screen calls unavailable
 * @param date the calendar date (yyyy-MM-dd): a value, or a sql expression per row
 * @param after the cutoff time (HH:mm) for that date: a value, a sql expression, or
 * undefined/null for no cutoff
 * @param exceptOrders orders that don't hold the slot (the app's booking: the client's own unpaid
 * order, cancelled when the new one is created); none for every list
 */
export const freeSlotWhere = ({
  date,
  after,
  exceptOrders,
}: {
  date: string | Prisma.Sql;
  after: string | Prisma.Sql | null | undefined;
  exceptOrders?: number[];
}) => Prisma.sql`
          AND (
            ${after}::time IS NULL
            OR ct."time"::time > ${after}::time
          )

          -- 🔴 Exclude Paid / Reserved Meetings (starting within the conflict window)
          AND NOT EXISTS (
            SELECT 1
            FROM "orders" o
            JOIN "payments" p ON p."orderId" = o.oid
            JOIN "meetings" m ON m."orderId" = o.oid
            WHERE
              o."consultantId" = ct."consultantId"
              AND ${startsNear({ date, time: Prisma.sql`ct."time"` }, { date: Prisma.sql`m."date"`, time: Prisma.sql`m."time"` })}${
                exceptOrders?.length
                  ? Prisma.sql`
              AND o.oid <> ALL(${exceptOrders}::int[])`
                  : Prisma.empty
              }
              AND (
                p."payment" = ${PaymentState.PAID}
                -- an unpaid order holds the slot for UNPAID_HOLD_MINUTES only
                OR (
                  p."payment" IN (${PaymentState.NEW}, ${PaymentState.PROCESSING})
                  AND o."created_at" > now() - make_interval(mins => ${UNPAID_HOLD_MINUTES}::int)
                )
              )
          )

          -- 🟢 Exclude Free Sessions (starting within the conflict window)
          AND NOT EXISTS (
            SELECT 1
            FROM "free_sessions" fs
            WHERE
              fs."consultantId" = ct."consultantId"
              AND ${startsNear({ date, time: Prisma.sql`ct."time"` }, { date: Prisma.sql`fs."date"`, time: Prisma.sql`fs."time"` })}
          )`;
