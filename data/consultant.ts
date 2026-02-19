"use server";
// pacakges
import { getDay, parseISO } from "date-fns";

// prisma db
import prisma from "@/lib/database/db";
import { Consultant, Coupon, Prisma } from "@/lib/generated/prisma/client";

// prisma types
import {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  PaymentState,
  ReviewState,
  Weekday,
} from "@/lib/generated/prisma/enums";

// types
import { ConsultantCard, OwnerPreview } from "@/types/layout";

// custom prisma data
export type ConsultantItem = {
  id: string;
  cid: number;
  image: string | null;
  name: string;
  title: string;
  rate: number | null;
  status: boolean;
  statusA: string;
  approved: string;
  created_at: Date;
  cost30: number;
  cost60: number;
  category: Categories;
  gender: Gender;
  review_count: number;
  years: number;
};

// get consultants with filter for consultant page
export const getConsultants = async (
  page: number = 1,
  search: string = "",
  orderBy: "newest" | "oldest" | "viral" = "newest",
  categories?: string[],
  gender?: string[],
  rate?: string,
  minCost?: string,
  maxCost?: string,
  date?: string,
  time?: string,
  specialties?: string[],
) => {
  try {
    const pageSize = 9;
    const min = minCost != null ? Number(minCost) : undefined;
    const max = maxCost != null ? Number(maxCost) : undefined;

    const weekday = date ? Object.keys(Weekday)[getDay(parseISO(date))] : null;

    const clause =
      orderBy === "newest"
        ? Prisma.sql`c."created_at" DESC`
        : orderBy === "oldest"
          ? Prisma.sql`c."created_at" ASC`
          : Prisma.sql`c."rate" DESC NULLS LAST, c."created_at" DESC`;

    const searchWhere = search
      ? Prisma.sql`AND LOWER(c.name) LIKE LOWER(${`%${search}%`})`
      : Prisma.empty;

    const costWhere =
      min != null && max != null
        ? Prisma.sql`
          AND (
            (c."cost30" BETWEEN ${min} AND ${max})
            OR (c."cost60" BETWEEN ${min} AND ${max})
          )
        `
        : min != null
          ? Prisma.sql`
          AND (
            c."cost30" >= ${min}
            OR c."cost60" >= ${min}
          )
        `
          : max != null
            ? Prisma.sql`
          AND (
            c."cost30" <= ${max}
            OR c."cost60" <= ${max}
          )
        `
            : Prisma.empty;

    const categoryWhere =
      Array.isArray(categories) && categories.length > 0
        ? Prisma.sql`AND c."category" = ANY (${categories}::"Categories"[])`
        : Prisma.empty;

    const genderWhere =
      Array.isArray(gender) && gender.length > 0
        ? Prisma.sql`AND c."gender" IN (${Prisma.join(
            gender.map((g) => Prisma.sql`${g}::"Gender"`),
          )})`
        : Prisma.empty;

    // rate
    const rateNumber = rate != null ? Number(rate) : null;

    // rate filter
    const rateWhere =
      rateNumber == null || rateNumber === 0
        ? Prisma.empty
        : Prisma.sql`
        AND c."rate" > ${rateNumber - 1}
        AND c."rate" <= ${rateNumber}
      `;

    // timing filter
    const timingJoin =
      weekday || time
        ? Prisma.sql`
          JOIN "consultant_timings" ct
            ON ct."consultantId" = c."cid"
        `
        : Prisma.empty;

    const timingWhere =
      weekday || time
        ? Prisma.sql`
          AND (${weekday ? Prisma.sql`ct."day" = ${weekday}::"Weekday"` : Prisma.sql`1=1`})
          AND (${time ? Prisma.sql`ct."time" = ${time}` : Prisma.sql`1=1`})
        `
        : Prisma.empty;

    // specialties filter: join through consultant_specialties -> specialties
    // const specialtiesJoin =
    //   Array.isArray(specialties) && specialties.length > 0
    //     ? Prisma.sql`
    //       JOIN "consultant_specialties" cs
    //         ON cs."consultantId" = c."cid"
    //       JOIN "specialties" s
    //         ON s."id" = cs."specialtyId"
    //     `
    //     : Prisma.empty;

    // const specialtiesWhere =
    //   Array.isArray(specialties) && specialties.length > 0
    //     ? Prisma.sql`AND s."id" = ANY (${specialties}::text[])`
    //     : Prisma.empty;

    // count
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT c.id)::bigint AS count
      FROM "consultants" c
      ${timingJoin}
      WHERE 1 = 1
        AND c."status" = true
        AND c."statusA" = 'PUBLISHED'
        AND c."approved" = 'APPROVED'
        ${searchWhere}
        ${costWhere}
        ${categoryWhere}
        ${genderWhere}
        ${rateWhere}
        ${timingWhere}
    `;

    const total = Number(result[0]?.count ?? 0);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), pages);

    // items
    const items = await prisma.$queryRaw<
      (ConsultantItem & {
        review_count: bigint;
        review_avg_rate: number | null;
      })[]
    >`
      SELECT
        c.id,
        c.cid,
        c.name,
        c.title,
        c.status,
        c.image,
        c."statusA",
        c.approved,
        c.created_at,
        c.rate,
        c."cost30",
        c."cost60",
        GREATEST(
        DATE_PART('year', AGE(NOW(), seniority)),
          1
        ) AS years,
        c."category"::text AS category,
        c."gender"::text   AS gender,
        COUNT(r.id)::bigint AS review_count
      FROM "consultants" c
      ${timingJoin}
      LEFT JOIN "reviews" r
        ON r."consultantId" = c."cid"
      WHERE 1 = 1
        AND c."status" = true
        AND c."statusA" = 'PUBLISHED'
        AND c."approved" = 'APPROVED'
        ${searchWhere}
        ${costWhere}
        ${categoryWhere}
        ${genderWhere}
        ${rateWhere}
        ${timingWhere}
      GROUP BY
        c.id,
        c.cid,
        c.name,
        c.title,
        c.status,
        c.image,
        c."statusA",
        c.approved,
        c.created_at,
        c."cost30",
        c."cost60",
        c."category",
        c."gender"
      ORDER BY ${clause}
      LIMIT ${pageSize} OFFSET ${(safePage - 1) * pageSize}
    `;

    return {
      items,
      total,
      pages,
      page: safePage,
    };
  } catch {
    return {
      items: [],
      total: 0,
      pages: 1,
      page: 1,
    };
  }
};

type ConsultantWithExtras = Consultant & {
  years: number;
  reviews: number;
  specialties: string[];
};

// get consultant for consultant page
export const getConsultant = async (cid: number) => {
  try {
    // get current times
    const consultant = await prisma.$queryRaw<ConsultantWithExtras[]>`
SELECT
  c.*,

  GREATEST(
    DATE_PART('year', AGE(NOW(), c.seniority))::int,
    1
  ) AS years,

  COUNT(DISTINCT r.id)::int AS reviews,

  COALESCE(
    ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL),
    '{}'
  ) AS specialties

FROM consultants c

LEFT JOIN reviews r
  ON r."consultantId" = c.cid
  AND r.status = 'PUBLISHED'

LEFT JOIN consultant_specialties cs
  ON cs."consultantId" = c.cid
LEFT JOIN specialties s
  ON s.id = cs."specialtyId"

WHERE c.cid = ${cid}
AND c.status = true
AND c."statusA" = 'PUBLISHED'
AND c.approved = 'APPROVED'

GROUP BY c.id, c.cid
`;

    // return
    return consultant[0] || null;
  } catch {
    // return
    return null;
  }
};

// get consultant basic data | meta data consutant
export const getConsultantInfo = async (cid: number) => {
  try {
    // get current times
    const consultant = await prisma.consultant.findFirst({
      where: { cid },
      select: { name: true, image: true, gender: true, approved: true },
    });
    // return
    return consultant || null;
  } catch {
    // return
    return null;
  }
};

// get consultant basic data | meta data consutant
export const getConsultantStates = async (cid: number) => {
  try {
    // get current times
    const consultant = await prisma.consultant.findFirst({
      where: { cid },
      select: { status: true, statusA: true, approved: true },
    });
    // return
    return consultant || null;
  } catch {
    // return
    return null;
  }
};

// get consultant coupons
export const getConsultantCoupons = async (cid: number) => {
  try {
    // get consultant coupons
    const coupons = await prisma.$queryRaw<Coupon[]>`
SELECT *
FROM "coupons"
WHERE "consultantId" = ${cid}
  AND "status" = 'PUBLISHED'
  AND "visibility" = 'PUBLIC'
  AND (
    ("starts_at" <= NOW() AND "expires_at" >= NOW()) OR
    ("starts_at" IS NULL AND "expires_at" >= NOW()) OR
    ("starts_at" <= NOW() AND "expires_at" IS NULL) OR
    ("starts_at" IS NULL AND "expires_at" IS NULL)
  )
ORDER BY RANDOM()
LIMIT 4`;
    // return
    return coupons || [];
  } catch {
    // return
    return [];
  }
};

// get consultant reviews
export const getConsultantReviews = async (cid: number) => {
  try {
    // get current times
    const consultant = await prisma.review.findMany({
      where: { consultantId: cid, status: ReviewState.PUBLISHED },
    });
    // return
    return consultant || [];
  } catch {
    // return
    return [];
  }
};

// get consultant timings
export const getConsultantAvailableTimes = async (
  cid: number,
  date: string,
  weekday: Weekday,
  now?: string,
) => {
  try {
    const rows = await prisma.$queryRaw<{ result: Record<string, string[]> }[]>`
      SELECT jsonb_object_agg(phase, times) AS result
      FROM (
        SELECT
          CASE
            WHEN ct."time" < '04:30' THEN 'late'
            WHEN ct."time" < '12:00' THEN 'day'
            WHEN ct."time" < '18:00' THEN 'noon'
            ELSE 'night'
          END AS phase,
          jsonb_agg(ct."time" ORDER BY ct."time"::time) AS times
        FROM "consultant_timings" ct
        WHERE
          ct."consultantId" = ${cid}
          AND ct."day" = ${weekday}::"Weekday"
          AND (
            ${now}::time IS NULL
            OR ct."time"::time > ${now}::time
          )
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
        GROUP BY phase
      ) t
    `;

    return rows[0].result ?? {};
  } catch {
    return {
      late: [],
      day: [],
      noon: [],
      night: [],
    };
  }
};

// get empty days
export const getUnavailableWeekdays = async (
  cid: number,
): Promise<Weekday[]> => {
  try {
    const missingDays = await prisma.$queryRaw<{ day: Weekday }[]>`
  WITH all_weekdays AS (
    SELECT unnest(enum_range(NULL::"Weekday")) AS day
  )
  SELECT aw.day
  FROM all_weekdays aw
  LEFT JOIN "consultant_timings" ct
    ON ct.day = aw.day AND ct."consultantId" = ${cid}
  WHERE ct.id IS NULL
`;

    return missingDays.map((d) => d.day) || [];
  } catch {
    return [];
  }
};

// get consultant cost
export const getConsultantCost = async (cid: number) => {
  try {
    const cost = await prisma.consultant.findUnique({
      where: {
        cid,
      },
      select: {
        cost30: true,
        cost60: true,
      },
    });

    // validate
    if (!cost) return null;

    return { 30: cost.cost30, 60: cost.cost60 };
  } catch {
    return null;
  }
};

// get reserved times
export const getConsultantReserved = async (cid: number, date: string) => {
  try {
    const reserved = await prisma.$queryRaw<{ time: string }[]>`
      SELECT m."time"
      FROM "Order" o
      JOIN "payments" p ON p.id = o."orderId"
      JOIN "meetings" m ON m."orderId" = o.id
      WHERE
        o."consultantId" = ${cid}
        AND p."payment" IN (${PaymentState.PAID}, ${PaymentState.PROCESSING})
        AND m."date" = ${date}
    `;

    // validate
    if (!reserved) return [];

    // time string[]
    return reserved.map((r) => r.time);
  } catch {
    return [];
  }
};

// get all published consultant profiles
export const getPuslishedConsultantsForHome = async () => {
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
      WHERE
        c.status = true
        AND c."statusA" = ${ConsultantState.PUBLISHED}::"ConsultantState"
        AND c.approved = ${ApprovalState.APPROVED}::"ApprovalState"
      ORDER BY RANDOM()
      LIMIT 15;
    `;

    return consultants;
  } catch {
    return [];
  }
};

// * old *//
export const getAllOwnersConsultants = async () => {
  try {
    // get all conultants owners
    const owners = await prisma.consultant.findMany();
    // return
    return owners;
  } catch {
    return undefined;
  }
};

// get all published consultant profiles
export const getAllOwnersPuslished = async () => {
  try {
    // get all conultants owners
    const owners = await prisma.consultant.findMany({
      where: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
      },
    });
    // return
    return owners;
  } catch {
    return null;
  }
};

// get all published consultant profiles
export const getAllOwnersPuslishedPreview = async () => {
  try {
    // get all conultants owners
    const owners = await prisma.consultant.findMany({
      where: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
        approved: ApprovalState.APPROVED,
      },
      select: {
        cid: true,
        name: true,
        title: true,
        image: true,
        category: true,
        rate: true,
        gender: true,
      },
    });
    // return
    return owners;
  } catch {
    return null;
  }
};

// get consultant by cid
export const getOwnerByCid = async (cid: number) => {
  try {
    // get all conultants owners
    const owner = await prisma.consultant.findFirst({
      where: {
        cid: cid,
      },
      include: {
        DiscountConsultant: true,
      },
    });
    // return
    return owner;
  } catch {
    return null;
  }
};

// get consultant by cid
export const getOwnerByCids = async (cids: number[]) => {
  try {
    // get all conultants owners
    const owner = await prisma.consultant.findMany({
      where: {
        cid: { in: cids },
      },
    });
    // return
    return owner;
  } catch {
    return null;
  }
};

// if owner exist
export const ownerExistbyAuthor = async (userId: string) => {
  try {
    const exist = await prisma.consultant.findFirst({
      where: { userId },
      select: { userId: true },
    });
    return exist;
  } catch {
    return null;
  }
};

// get consultant profile by author
export const getOwnerbyAuthor = async (userId: string) => {
  try {
    const exist = await prisma.consultant.findFirst({
      where: { userId },
    });
    return exist;
  } catch {
    return null;
  }
};

// get times by day and cid
export const getOwnersInfoCid = async (cid: number) => {
  try {
    // get current times
    const onwer = await prisma.consultant.findFirst({
      where: { cid },
      select: { name: true, image: true, gender: true },
    });
    // return
    return onwer;
  } catch {
    // return
    return undefined;
  }
};

// get times by day and cid
export const getOwnersInfoByAuthor = async (userId: string) => {
  try {
    // get current times
    const onwer = await prisma.consultant.findFirst({
      where: { userId },
      select: { name: true, image: true, gender: true },
    });
    // return
    return onwer;
  } catch {
    // return
    return undefined;
  }
};

// get times by day and cid
export const getOwnerCidByAuthor = async (userId: string) => {
  try {
    // get current times
    const onwer = await prisma.consultant.findFirst({
      where: { userId },
      select: { cid: true },
    });
    // return
    return onwer?.cid;
  } catch {
    // return
    return undefined;
  }
};

// get times by day and cid
export const getOwnerCidNameByAuthor = async (userId: string) => {
  try {
    // get current times
    const onwer = await prisma.consultant.findFirst({
      where: { userId },
      select: { cid: true, name: true },
    });
    // return
    return onwer;
  } catch {
    // return
    return undefined;
  }
};

// get owner for dues
export const getOwnerForDues = async (userId: string) => {
  try {
    // get current times
    const onwer = await prisma.consultant.findFirst({
      where: { userId },
      select: { cid: true, name: true, commission: true },
    });
    // return
    return onwer;
  } catch {
    // return
    return undefined;
  }
};

// get owners available soon
export async function getAvailableOwnersGrouped(
  day: Weekday,
  date: string,
  time: string,
) {
  try {
    const results = await prisma.$queryRaw<
      {
        time: string;
        cid: number;
        name: string;
        title: string;
        image: string | null;
        category: string | null;
        rate: number | null;
        gender: string | null;
      }[]
    >`
WITH reserved_times AS (
  SELECT DISTINCT m.time, o."consultantId"
  FROM "meetings" m
  JOIN "orders" o ON m."orderId" = o.oid
  JOIN "payments" p ON o.oid = p."orderId"
  WHERE m.date = ${date}
    AND p.payment IN ('NEW', 'PROCESSING', 'PAID')
)
SELECT *
FROM (
  SELECT
    TO_CHAR(ct.time::TIME, 'HH24:MI') AS time,
    c.cid,
    c.name,
    c.title,
    c.image,
    c.category,
    c.rate,
    c.gender,
    CASE WHEN dc."discountId" IS NOT NULL THEN true ELSE false END AS "discount",
    ROW_NUMBER() OVER (PARTITION BY ct.time ORDER BY RANDOM()) as rn
  FROM "consultant_timings" ct
  JOIN "consultants" c ON ct."consultantId" = c.cid
  LEFT JOIN reserved_times rt 
    ON rt.time = ct.time AND rt."consultantId" = ct."consultantId"
  LEFT JOIN discount_consultants dc 
    ON c.cid = dc."consultantId" 
   AND dc."discountId" = 1
  WHERE ct.day = CAST(${day} AS "Weekday")
    AND ct.time::TIME > ${time}::TIME
    AND rt.time IS NULL
    AND c.status = true
    AND c."statusA" = ${ConsultantState.PUBLISHED}::"ConsultantState"
    AND c.approved = ${ApprovalState.APPROVED}::"ApprovalState"
) AS sub
WHERE rn <= 4
ORDER BY time ASC;
`;

    // Group the results by time
    const grouped: Record<string, typeof results> = {};
    for (const entry of results) {
      if (!grouped[entry.time]) grouped[entry.time] = [];
      grouped[entry.time].push(entry);
    }

    return Object.entries(grouped).map(([time, consultants]) => ({
      time,
      consultants,
    }));
  } catch {
    return [];
  }
}

// get owners available soon
export async function getAvailableOwnersByTime(
  day: Weekday,
  date: string,
  selected: string,
) {
  try {
    const results = await prisma.$queryRaw<
      {
        cid: number;
        name: string;
        title: string;
        image: string | null;
        category: string | null;
        rate: number | null;
        gender: string | null;
      }[]
    >`
WITH reserved_consultants AS (
  SELECT DISTINCT o."consultantId"
  FROM "meetings" m
  JOIN "orders" o ON m."orderId" = o.oid
  JOIN "payments" p ON o.oid = p."orderId"
  WHERE m.date = ${date}
    AND m.time = ${selected}
    AND p.payment IN ('NEW', 'PROCESSING', 'PAID')
)

SELECT
  c.cid,
  c.name,
  c.title,
  c.image,
  c.category,
  c.rate,
  c.gender
FROM "consultant_timings" ct
JOIN "consultants" c ON ct."consultantId" = c.cid
LEFT JOIN reserved_consultants rc ON rc."consultantId" = ct."consultantId"
WHERE ct.day = CAST(${day} AS "Weekday")
  AND ct.time = ${selected}
  AND rc."consultantId" IS NULL
ORDER BY RANDOM();
`;

    return results;
  } catch {
    return null;
  }
}

// get only consultants with discount did = 1
export async function getDiscountedConsultants(
  did: number = 1,
): Promise<OwnerPreview[]> {
  const consultants = await prisma.$queryRaw<OwnerPreview[]>`
    SELECT 
      c.cid,
      c.name,
      c.title,
      c.image,
      c.category,
      c.rate,
      c.gender,
      d.discount
    FROM consultants c
    INNER JOIN discount_consultants dc 
      ON c.cid = dc."consultantId" 
     AND dc."discountId" = ${did}
    INNER JOIN discounts d 
      ON d.did = dc."discountId"
    WHERE 
      c.status = true
      AND c."statusA" = ${ConsultantState.PUBLISHED}::"ConsultantState"
      AND c.approved = ${ApprovalState.APPROVED}::"ApprovalState"
    ORDER BY RANDOM()
  `;

  return consultants;
}
