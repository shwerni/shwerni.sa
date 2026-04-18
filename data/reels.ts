"use server";
import prisma from "@/lib/database/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  Weekday,
} from "@/lib/generated/prisma/enums";
import { dateToWeekDay } from "@/utils/date";

type ReelConsultant = {
  cid: number;
  name: string;
  title: string;
  nabout: string;
  gender: Gender;
  category: Categories;
  image: string | null;
  rate: number;
  cost30: number;
  cost45: number;
  cost60: number;
  years: number;
  seniority: Date;
  review_count: number;
};
function calcYears(seniority: Date): number {
  return Math.max(
    1,
    Math.floor(
      (Date.now() - seniority.getTime()) / (1000 * 60 * 60 * 24 * 365),
    ),
  );
}

export async function getAvailableTimesForDate(
  date: string,
  minTime?: string,
): Promise<string[]> {
  const weekday = dateToWeekDay(new Date(date)) as Weekday;

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
  if (minTime) times = times.filter((t) => t >= minTime);
  return times;
}

export async function getConsultantsAvailableAt(
  date: string,
  time: string,
  gender: Gender | null = null,
  category: Categories | null = null,
  skip = 0,
  take = 5,
) {
  const weekday = dateToWeekDay(new Date(date));

  const rows = await prisma.$queryRaw<ReelConsultant[]>`
    SELECT 
      c.cid, c.name, c.title, c.nabout, c.gender, c.category, c.image, c.rate,
      c.cost30, c.cost45, c.cost60, c.seniority,
      (
        SELECT COUNT(*)::int 
        FROM reviews r 
        WHERE r."consultantId" = c.cid 
          AND r.status = 'PUBLISHED'
      ) as review_count
    FROM consultants c
    INNER JOIN consultant_timings ct ON c.cid = ct."consultantId"
    WHERE c.status = true
      -- Postgres requires strict casting for Prisma Enums in Raw SQL
      AND c."statusA" = 'PUBLISHED'::"ConsultantState"
      AND c.approved = 'APPROVED'::"ApprovalState"
      AND ct.day = ${weekday}::"Weekday"
      AND ct.time = ${time}
      
      -- Conditionally inject optional filters
      ${gender ? Prisma.sql`AND c.gender = ${gender}::"Gender"` : Prisma.empty}
      ${category ? Prisma.sql`AND c.category = ${category}::"Categories"` : Prisma.empty}
      
      -- NOT EXISTS replaces the need to fetch bookedIds first
      AND NOT EXISTS (
        SELECT 1
        FROM orders o
        INNER JOIN meetings m ON o.oid = m."orderId"
        INNER JOIN payments p ON p."orderId" = o.oid
        WHERE o."consultantId" = c.cid
          AND m.date = ${date}
          AND m.time = ${time}
          AND p.payment = 'PAID'
      )
    ORDER BY c.sort_key DESC
    LIMIT ${take + 1}
    OFFSET ${skip};
  `;

  const hasMore = rows.length > take;

  return {
    hasMore,
    consultants: rows.slice(0, take).map((c) => ({
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
      review_count: c.review_count,
    })),
  };
}
