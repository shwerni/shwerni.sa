// prisma
import { Prisma } from "@/lib/generated/prisma/client";
import { PaymentState } from "@/lib/generated/prisma/enums";

/**
 * the single rule for "this weekly timing ct is a free slot on this date", appended to a
 * WHERE on "consultant_timings" ct: after the same-day cutoff, no paid / new / processing
 * meeting and no free session at that time. getConsultantAvailableTimes (times route,
 * website date steps, Pay's slot check) and the mobile next-slots query both use it, so a
 * card can never show a slot the booking screen calls unavailable
 * @param date the calendar date (yyyy-MM-dd): a value, or a sql expression per row
 * @param after the cutoff time (HH:mm) for that date: a value, a sql expression, or
 * undefined/null for no cutoff
 */
export const freeSlotWhere = ({
  date,
  after,
}: {
  date: string | Prisma.Sql;
  after: string | Prisma.Sql | null | undefined;
}) => Prisma.sql`
          AND (
            ${after}::time IS NULL
            OR ct."time"::time > ${after}::time
          )

          -- 🔴 Exclude Paid / Reserved Meetings
          AND NOT EXISTS (
            SELECT 1
            FROM "orders" o
            JOIN "payments" p ON p."orderId" = o.oid
            JOIN "meetings" m ON m."orderId" = o.oid
            WHERE
              o."consultantId" = ct."consultantId"
              AND m."time" = ct."time"
              AND m."date" = ${date}
              AND p."payment" IN (
                ${PaymentState.PAID},
                ${PaymentState.NEW},
                ${PaymentState.PROCESSING}
              )
          )

          -- 🟢 Exclude Free Sessions (NEW ADDITION)
          AND NOT EXISTS (
            SELECT 1
            FROM "free_sessions" fs
            WHERE
              fs."consultantId" = ct."consultantId"
              AND fs."time" = ct."time"
              AND fs."date" = ${date}
          )`;
