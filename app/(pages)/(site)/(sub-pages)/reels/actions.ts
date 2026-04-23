"use server";
import prisma from "@/lib/database/db";
import {
  ApprovalState,
  ConsultantState,
  ReviewState,
  Weekday,
} from "@/lib/generated/prisma/enums";
import { dateToWeekDay } from "@/utils/date";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReelConsultant = {
  cid: number;
  name: string;
  title: string;
  nabout: string;
  gender: string;
  category: string;
  image: string | null;
  rate: number;
  cost30: number;
  cost45: number;
  cost60: number;
  years: number;
  review_count: number;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function calcYears(seniority: Date): number {
  return Math.max(
    1,
    Math.floor(
      (Date.now() - seniority.getTime()) / (1000 * 60 * 60 * 24 * 365),
    ),
  );
}

// ─── 1. Get all distinct available times for a given date ────────────────────
//
// Returns a sorted array of time strings (e.g. ["09:00","09:30",...]) that at
// least one active/approved consultant has in their schedule for that weekday.
// Optionally pass `minTime` (e.g. "09:25") to strip past times for today.

export async function getAvailableTimesForDate(
  date: string, // "yyyy-MM-dd"
  minTime?: string, // "HH:mm" — filter out slots before this time (for today)
): Promise<string[]> {
  const weekday = dateToWeekDay(new Date(date)) as Weekday;

  // All distinct times active consultants have for this weekday
  const rows = await prisma.consultantTiming.findMany({
    where: {
      day: weekday,
      consultant: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
        approved: ApprovalState.APPROVED,
      },
    },
    select: { time: true },
    distinct: ["time"],
    orderBy: { time: "asc" },
  });

  let times = rows.map((r) => r.time);

  if (minTime) {
    times = times.filter((t) => t >= minTime);
  }

  return times;
}

// ─── 2. Get consultants available at a specific date + time ──────────────────
//
// Returns consultants who:
//   ✓ are active, visible, approved
//   ✓ have a timing slot for this weekday + time
//   ✗ do NOT have a conflicting PAID order/meeting at this date + time

export async function getConsultantsAvailableAt(
  date: string, // "yyyy-MM-dd"
  time: string, // "HH:mm"
): Promise<ReelConsultant[]> {
  const weekday = dateToWeekDay(new Date(date)) as Weekday;

  // Step 1 — find consultant IDs that already have a PAID booking at this slot
  const booked = await prisma.$queryRaw<{ consultantId: number }[]>`
    SELECT DISTINCT o."consultantId"
    FROM orders o
    JOIN meetings m ON o.oid = m."orderId"
    JOIN payments p ON p."orderId" = o.oid
    WHERE m.date  = ${date}
      AND m.time  = ${time}
      AND p.payment = 'PAID'
  `;

  const bookedIds = booked.map((r) => r.consultantId);

  // Step 2 — query consultants with the matching timing slot, excluding booked
  const consultants = await prisma.consultant.findMany({
    where: {
      status: true,
      statusA: ConsultantState.PUBLISHED,
      approved: ApprovalState.APPROVED,
      ...(bookedIds.length > 0 && {
        cid: { notIn: bookedIds },
      }),
      consultantTiming: {
        some: {
          day: weekday,
          time: time,
        },
      },
    },
    select: {
      cid: true,
      name: true,
      title: true,
      nabout: true,
      gender: true,
      category: true,
      image: true,
      rate: true,
      cost30: true,
      cost45: true,
      cost60: true,
      seniority: true,
      _count: {
        select: { reviews: { where: { status: ReviewState.PUBLISHED } } },
      },
    },
    orderBy: { sort_key: "desc" },
  });

  return consultants.map((c) => ({
    cid: c.cid,
    name: c.name,
    title: c.title,
    nabout: c.nabout,
    gender: c.gender,
    category: c.category,
    image: c.image,
    rate: c.rate,
    cost30: c.cost30,
    cost45: c.cost45,
    cost60: c.cost60,
    years: calcYears(c.seniority),
    review_count: c._count.reviews,
  }));
}
