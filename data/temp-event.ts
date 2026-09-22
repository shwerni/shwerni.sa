import "server-only";

// Next
import { revalidateTag } from "next/cache";

// constants
import {
  EVENT_DATE,
  EVENT_MAX_RESERVATIONS_PER_CONSULTANT,
} from "@/components/clients/event/constant";

// prisma
import prisma from "@/lib/database/db";
import {
  ApprovalState,
  ConsultantState,
  ReviewState,
} from "@/lib/generated/prisma/enums";

// types
import { ConsultantCard } from "@/types/layout";

type EventFreeSessionInput = {
  author: string;
  name: string;
  phone: string;
  time: string;
  duration: string;
  info: string[];
};

export type CreateEventFreeSessionResult =
  | { ok: true; fid: number }
  | { ok: false; reason: "CONSULTANT_FULL" };

// event consultants — excludes anyone who already hit the daily cap
export const getEventConsultants = async () => {
  try {
    const consultants = await prisma.$queryRaw<ConsultantCard[]>`
      SELECT
        c.cid,
        c.name,
        c.title,
        c.image,
        c.category,
        c.rate,
        c.gender,
        c.created_at,
        c."cost30",

        (
          SELECT COUNT(*)
          FROM "reviews" r
          WHERE
            r."consultantId" = c.cid
            AND r.status = ${ReviewState.PUBLISHED}::"ReviewState"
        ) AS reviews,

        GREATEST(
          DATE_PART('year', AGE(NOW(), c.seniority))::int,
          1
        ) AS years,

        COALESCE(
          (
            SELECT ARRAY_AGG(s.name)
            FROM "consultant_specialties" cs
            JOIN "specialties" s ON s.id = cs."specialtyId"
            WHERE cs."consultantId" = c.cid
          ),
          ARRAY[]::text[]
        ) AS specialties

      FROM "consultants" c
      LEFT JOIN (
        SELECT "consultantId", COUNT(*)::int AS reserved_count
        FROM "free_sessions"
        WHERE "date" = ${EVENT_DATE}
        GROUP BY "consultantId"
      ) fs ON fs."consultantId" = c.cid
      WHERE
        c.status = true
        AND c."statusA" = ${ConsultantState.PUBLISHED}::"ConsultantState"
        AND c.approved = ${ApprovalState.APPROVED}::"ApprovalState"
        AND COALESCE(fs.reserved_count, 0) < ${EVENT_MAX_RESERVATIONS_PER_CONSULTANT}
      ORDER BY RANDOM()
      LIMIT 15;
    `;

    return consultants;
  } catch {
    return [];
  }
};

// atomic capped booking — call ONLY from a validated "use server" action
export async function createEventFreeSession(
  cid: number,
  data: EventFreeSessionInput,
): Promise<CreateEventFreeSessionResult> {
  const result = await prisma.$transaction(async (tx) => {
    // serialize concurrent bookings for this consultant only
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${cid})`;

    const reservedCount = await tx.freeSession.count({
      where: { consultantId: cid, date: EVENT_DATE },
    });

    if (reservedCount >= EVENT_MAX_RESERVATIONS_PER_CONSULTANT) {
      return { ok: false as const, reason: "CONSULTANT_FULL" as const };
    }

    const session = await tx.freeSession.create({
      data: { ...data, date: EVENT_DATE, consultantId: cid },
      select: { fid: true },
    });

    return { ok: true as const, fid: session.fid };
  });

  // purge event carousel/list only after a real booking
  if (result.ok) revalidateTag("event-consultants", "max");

  return result;
}