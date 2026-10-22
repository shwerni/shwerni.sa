import "server-only";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ApprovalState,
  ConsultantState,
  PaymentState,
} from "@/lib/generated/prisma/enums";

// the one rule both online lists use (the website's getOnlineConsultantsList and the app's
// getConsultantsOnline), on the consultants table aliased as c

// listable: approved, active, published, and not a center consultant
export const ONLINE_LISTABLE = Prisma.sql`
  c.status = true
  AND c."centerId" IS NULL
  AND c.approved = ${ApprovalState.APPROVED}::"ApprovalState"
  AND c."statusA" = ${ConsultantState.PUBLISHED}::"ConsultantState"
`;

// a riyadh calendar day ("YYYY-MM-DD") of an instant, `back` days earlier
const riyadhDay = (at: Date, back = 0) =>
  Prisma.sql`TO_CHAR((${at}::timestamptz AT TIME ZONE 'UTC') + INTERVAL '3 hours' - ${back}::int * INTERVAL '1 day', 'YYYY-MM-DD')`;

/**
 * busy at some moment of [from, to] (both included): a PAID meeting that isn't done with
 * start <= to and from < start + duration. meetings keep riyadh wall-clock strings (date
 * "YYYY-MM-DD", time "HH:mm", duration in minutes), so the start is read with a fixed +03:00
 * (riyadh has no dst) and a session crossing midnight stays busy after 00:00. only the meetings
 * dated the day before `from`, `from`'s day and `to`'s day (riyadh) are looked at. a malformed time
 * or duration is never cast (CASE), so one bad row can't break the query. exceptOid leaves one
 * order out (a payment checking its own order)
 */
export function consultantBusyBetween(
  from: Date,
  to: Date,
  { exceptOid }: { exceptOid?: number } = {},
): Prisma.Sql {
  return Prisma.sql`
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN payments p ON p."orderId" = o.oid
      JOIN meetings m ON m."orderId" = o.oid
      WHERE o."consultantId" = c.cid
        AND p.payment = ${PaymentState.PAID}::"PaymentState"
        AND m.done = false
        ${exceptOid === undefined ? Prisma.empty : Prisma.sql`AND o.oid <> ${exceptOid}`}
        AND m.date IN (${riyadhDay(from, 1)}, ${riyadhDay(from)}, ${riyadhDay(to)})
        AND CASE
          WHEN m.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND m.duration ~ '^[0-9]{1,3}$'
          THEN (m.date || 'T' || m.time || ':00+03:00')::timestamptz <= ${to}::timestamptz
            AND ${from}::timestamptz <
              (m.date || 'T' || m.time || ':00+03:00')::timestamptz
                + (m.duration || ' minutes')::interval
          ELSE false
        END
    )
  `;
}

// busy right now: start <= now < start + duration (the online lists' rule)
export function consultantBusyAt(now: Date): Prisma.Sql {
  return consultantBusyBetween(now, now);
}
