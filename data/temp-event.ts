import "server-only";

// constants
import {
  EVENT_DATE,
  EVENT_DISCOUNT_ID,
  EVENT_MAX_RESERVATIONS_PER_CONSULTANT,
} from "@/components/clients/event/constant";

// prisma
import prisma from "@/lib/database/db";
import {
  ApprovalState,
  ConsultantState,
  ReviewState,
} from "@/lib/generated/prisma/enums";

// lib
import { timeZone } from "@/lib/site/time";

// types
import { ConsultantCard } from "@/types/layout";

export type EventBookingReason =
  | "OUTSIDE_WINDOW"
  | "NOT_IN_EVENT"
  | "ALREADY_BOOKED"
  | "CONSULTANT_FULL"
  | "SLOT_TAKEN";

// same client = same phone, or same logged-in account ("temp" = guest, never matched)
const sameClientWhere = (phone: string, author: string) => ({
  date: EVENT_DATE,
  OR: [{ phone }, ...(author && author !== "temp" ? [{ author }] : [])],
});

// event consultants — enrolled in the event discount, excluding anyone at the daily cap
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
      JOIN "discount_consultants" dc
        ON dc."consultantId" = c.cid
        AND dc."discountId" = ${EVENT_DISCOUNT_ID}
        AND dc."status" = true
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

// how many event sessions this consultant already has on the event day
export const getEventReservedCount = async (cid: number) => {
  return prisma.freeSession.count({
    where: { consultantId: cid, date: EVENT_DATE },
  });
};

// is this consultant actively enrolled in the event discount?
export const isEventConsultant = async (cid: number) => {
  const row = await prisma.discountConsultant.findUnique({
    where: {
      consultantId_discountId: {
        consultantId: cid,
        discountId: EVENT_DISCOUNT_ID,
      },
    },
    select: { status: true },
  });

  return !!row?.status;
};

// pre-insert checks — fast rejection with a clear reason
export async function checkEventBooking(
  cid: number,
  time: string,
  phone: string,
  author: string,
): Promise<EventBookingReason | null> {
  // event day in Riyadh
  if (timeZone().date !== EVENT_DATE) return "OUTSIDE_WINDOW";

  const [enrolled, sessions, previous] = await Promise.all([
    isEventConsultant(cid),
    prisma.freeSession.findMany({
      where: { consultantId: cid, date: EVENT_DATE },
      select: { time: true },
    }),
    prisma.freeSession.findFirst({
      where: sameClientWhere(phone, author),
      select: { fid: true },
    }),
  ]);

  if (!enrolled) return "NOT_IN_EVENT";
  if (previous) return "ALREADY_BOOKED";
  if (sessions.length >= EVENT_MAX_RESERVATIONS_PER_CONSULTANT)
    return "CONSULTANT_FULL";
  if (sessions.some((s) => s.time === time)) return "SLOT_TAKEN";

  return null;
}
// post-insert guard — race-safe: the earliest fids win, a losing booking is removed
export async function enforceEventLimits(
  cid: number,
  fid: number,
  time: string,
  phone: string,
  author: string,
): Promise<EventBookingReason | null> {
  const [clientSessions, consultantSessions] = await Promise.all([
    prisma.freeSession.findMany({
      where: sameClientWhere(phone, author),
      select: { fid: true },
      orderBy: { fid: "asc" },
    }),
    prisma.freeSession.findMany({
      where: { consultantId: cid, date: EVENT_DATE },
      select: { fid: true, time: true },
      orderBy: { fid: "asc" },
    }),
  ]);

  // same phone/account already booked first (double submit, two tabs)
  const alreadyBooked =
    clientSessions.length > 0 && clientSessions[0].fid !== fid;

  // someone booked the same slot first
  const firstInSlot = consultantSessions.find((s) => s.time === time);
  const slotTaken = !!firstInSlot && firstInSlot.fid !== fid;

  // not among the first N bookings of the day
  const withinCap = consultantSessions
    .slice(0, EVENT_MAX_RESERVATIONS_PER_CONSULTANT)
    .some((s) => s.fid === fid);

  if (alreadyBooked || slotTaken || !withinCap) {
    await prisma.freeSession.delete({ where: { fid } });
    if (alreadyBooked) return "ALREADY_BOOKED";
    return slotTaken ? "SLOT_TAKEN" : "CONSULTANT_FULL";
  }

  return null;
}
