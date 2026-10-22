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

/**
 * busy: a PAID meeting that isn't done and runs at `now`, start <= now < start + duration.
 * meetings keep riyadh wall-clock strings (date "YYYY-MM-DD", time "HH:mm", duration in minutes),
 * so the start is read with a fixed +03:00 (riyadh has no dst) and a session crossing midnight
 * stays busy after 00:00. only today's and yesterday's meetings (riyadh dates) are looked at.
 * a malformed time or duration is never cast (CASE), so one bad row can't break the list
 */
export function consultantBusyAt(now: Date): Prisma.Sql {
  return Prisma.sql`
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN payments p ON p."orderId" = o.oid
      JOIN meetings m ON m."orderId" = o.oid
      WHERE o."consultantId" = c.cid
        AND p.payment = ${PaymentState.PAID}::"PaymentState"
        AND m.done = false
        AND m.date IN (
          TO_CHAR((${now}::timestamptz AT TIME ZONE 'UTC') + INTERVAL '3 hours', 'YYYY-MM-DD'),
          TO_CHAR((${now}::timestamptz AT TIME ZONE 'UTC') + INTERVAL '3 hours' - INTERVAL '1 day', 'YYYY-MM-DD')
        )
        AND CASE
          WHEN m.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND m.duration ~ '^[0-9]{1,3}$'
          THEN (m.date || 'T' || m.time || ':00+03:00')::timestamptz <= ${now}::timestamptz
            AND ${now}::timestamptz <
              (m.date || 'T' || m.time || ':00+03:00')::timestamptz
                + (m.duration || ' minutes')::interval
          ELSE false
        END
    )
  `;
}
