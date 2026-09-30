import "server-only";
// prisma db
import prisma from "@/lib/database/db";
import { getSetting } from "./admin/settings/settings";
import { timeZone } from "@/lib/site/time";
import { Categories, Gender, Prisma } from "@/lib/generated/prisma/client";

// get all published coupons
export const getActiveDiscounts = async () => {
  try {
    const discount = await prisma.discount.findMany({
      where: { status: true },
    });
    return discount;
  } catch {
    return null;
  }
};

// get all published coupons
export const getDiscountByDid = async (did: number) => {
  try {
    const discount = await prisma.discount.findUnique({
      where: { did },
    });
    return discount;
  } catch {
    return null;
  }
};

export const toggleDiscountState = async (
  did: number,
  status: boolean,
  cid: number,
) => {
  try {
    await prisma.discountConsultant.upsert({
      where: {
        consultantId_discountId: { discountId: did, consultantId: cid },
      },
      update: {
        consultantId: cid,
        status,
      },
      create: {
        discountId: did,
        consultantId: cid,
        status,
      },
    });
    console.log(status);
    return true;
  } catch {
    return null;
  }
};

// get all published coupons
export const getDiscountConsultant = async (did: number, cid: number) => {
  try {
    const discount = await prisma.discountConsultant.findUnique({
      where: {
        consultantId_discountId: {
          discountId: did,
          consultantId: cid,
        },
      },
    });
    return discount;
  } catch {
    return null;
  }
};

// temp function
// custom prisma data
type ConsultantItem = {
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

export const getDiscountConsultants = async (
  discount: number,
  page: number = 1,
  search: string = "",
  categories?: string[],
  gender?: string[],
) => {
  try {
    const pageSize = 9;

    const searchWhere = search
      ? Prisma.sql`AND LOWER(c.name) LIKE LOWER(${`%${search}%`})`
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

    // ---------- COUNT ----------
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT c.id)::bigint AS count
      FROM "consultants" c
      JOIN "discount_consultants" dc
        ON dc."consultantId" = c."cid"
      WHERE
        c."status" = true
        AND c."statusA"  = 'PUBLISHED'::"ConsultantState"
        AND c."approved" = 'APPROVED'::"ApprovalState"
        AND dc."discountId" = ${discount}
        AND dc."status" = true
        ${searchWhere}
        ${categoryWhere}
        ${genderWhere}
    `;

    const total = Number(result[0]?.count ?? 0);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), pages);

    // ---------- ITEMS ----------
    const items = await prisma.$queryRaw<
      (ConsultantItem & { review_count: bigint })[]
    >`
      SELECT
        c.id,
        c.cid,
        c.name,
        c.title,
        c.image,
        c.created_at,
        c.rate,
        c."cost30",
        c."cost60",
        c."category"::text AS category,
        c."gender"::text   AS gender,
        GREATEST(
        DATE_PART('year', AGE(NOW(), seniority)),
          1
        ) AS years,
        COUNT(r.id)::bigint AS review_count
      FROM "consultants" c
      JOIN "discount_consultants" dc
        ON dc."consultantId" = c."cid"
      LEFT JOIN "reviews" r
        ON r."consultantId" = c."cid"
      WHERE
        c."status" = true
        AND c."statusA"  = 'PUBLISHED'::"ConsultantState"
        AND c."approved" = 'APPROVED'::"ApprovalState"
        AND dc."discountId" = ${discount}
        AND dc."status" = true
        ${searchWhere}
        ${categoryWhere}
        ${genderWhere}
      GROUP BY
        c.id,
        c.cid,
        c.name,
        c.title,
        c.image,
        c.created_at,
        c.rate,
        c."cost30",
        c."cost60",
        c."category",
        c."gender"
      ORDER BY c."created_at" DESC
      LIMIT ${pageSize}
      OFFSET ${(safePage - 1) * pageSize}
    `;

    return {
      items,
      total,
      pages,
      page: safePage,
    };
  } catch (error) {
    console.log(error);
    return {
      items: [],
      total: 0,
      pages: 1,
      page: 1,
    };
  }
};