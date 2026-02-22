"use server";
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

// get active discount
export const getActiveDiscount = async () => {
  try {
    // get active discount
    const active = await getSetting<number>("discounts", "active");

    // validate
    if (!active) return null;

    // discount
    const discount = await prisma.discount.findUnique({
      where: { did: active },
    });

    // return
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

// get certain discount
export const applyDiscount = async (user: string, did: number, cid: number) => {
  try {
    // date
    const { iso: now } = timeZone();

    // get discount with consultants
    const discount = await prisma.discount.findUnique({
      where: { did },
    });

    // not found or inactive
    if (!discount || !discount.status || !discount.visibility) {
      return { state: false, message: "هذا الخصم غير متاح حالياً." };
    }

    // check if discount is linked to this consultant
    const isLinked = await prisma.discountConsultant.findUnique({
      where: {
        consultantId_discountId: { discountId: did, consultantId: cid },
      },
    });

    if (!isLinked) {
      return { state: false, message: "هذا الخصم غير مخصص لهذا المستشار." };
    }

    if (discount.startDate && now < discount.startDate) {
      return { state: false, message: "الخصم لم يبدأ بعد." };
    }

    if (discount.endDate && now > discount.endDate) {
      return { state: false, message: "انتهت صلاحية الخصم." };
    }

    // guest user restriction (if limit is set)
    if (user === "temp" && discount.limit !== null) {
      return {
        state: false,
        message: "يجب تسجيل الدخول لاستخدام هذا الخصم.",
      };
    }

    // user usage count
    const userUsageCount = discount.users.filter((u) => u === user).length;

    if (discount.limit !== null && userUsageCount >= discount.limit) {
      return {
        state: false,
        message: "لقد استخدمت الحد المسموح به من هذا الخصم.",
      };
    }

    return {
      state: true,
      discount: discount.discount,
      did: discount.did,
      message: "تم تطبيق الخصم",
    };
  } catch {
    return { state: false, message: "الخصم غير صالح." };
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

// get consultant with filters based on discount
// export const getDiscountConsultants = async (
//   page: number = 1,
//   search: string = "",
//   categories?: string[],
//   gender?: string[],
// ) => {
//   try {
//     const pageSize = 9;

//     const searchWhere = search
//       ? Prisma.sql`AND LOWER(c.name) LIKE LOWER(${`%${search}%`})`
//       : Prisma.empty;

//     const categoryWhere =
//       Array.isArray(categories) && categories.length > 0
//         ? Prisma.sql`AND c."category" = ANY (${categories}::"Categories"[])`
//         : Prisma.empty;

//     const genderWhere =
//       Array.isArray(gender) && gender.length > 0
//         ? Prisma.sql`AND c."gender" IN (${Prisma.join(
//             gender.map((g) => Prisma.sql`${g}::"Gender"`),
//           )})`
//         : Prisma.empty;

//     // ---------- COUNT ----------
//     const result = await prisma.$queryRaw<{ count: bigint }[]>`
//       SELECT COUNT(DISTINCT c.id)::bigint AS count
//       FROM "consultants" c
//       JOIN "discount_consultants" dc
//         ON dc."consultantId" = c."cid"
//       WHERE
//         c."status" = true
//         AND dc."discountId" = 5
//         AND dc."status" = true
//         ${searchWhere}
//         ${categoryWhere}
//         ${genderWhere}
//     `;

//     const total = Number(result[0]?.count ?? 0);
//     const pages = Math.max(1, Math.ceil(total / pageSize));
//     const safePage = Math.min(Math.max(page, 1), pages);

//     const items = await prisma.$queryRaw<
//       (ConsultantItem & { review_count: bigint })[]
//     >`
//       SELECT
//         c.id,
//         c.cid,
//         c.name,
//         c.title,
//         c.image,
//         c.created_at,
//         c.rate,
//         c."cost30",
//         c."cost60",
//         c."category"::text AS category,
//         c."gender"::text   AS gender,
//         COUNT(r.id)::bigint AS review_count
//       FROM "consultants" c
//       JOIN "discount_consultants" dc
//         ON dc."consultantId" = c."cid"
//       LEFT JOIN "reviews" r
//         ON r."consultantId" = c."cid"
//       WHERE
//         c."status" = true
//         AND dc."discountId" = 5
//         AND dc."status" = true
//         ${searchWhere}
//         ${categoryWhere}
//         ${genderWhere}
//       GROUP BY
//         c.id,
//         c.cid,
//         c.name,
//         c.title,
//         c.image,
//         c.created_at,
//         c.rate,
//         c."cost30",
//         c."cost60",
//         c."category",
//         c."gender"
//       ORDER BY c."created_at" DESC
//       LIMIT ${pageSize}
//       OFFSET ${(safePage - 1) * pageSize}
//     `;

//     return {
//       items,
//       total,
//       pages,
//       page: safePage,
//     };
//   } catch (error) {
//     console.log(error);
//     return {
//       items: [],
//       total: 0,
//       pages: 1,
//       page: 1,
//     };
//   }
// };
export const getDiscountConsultants = async (
  page: number = 1,
  search: string = "",
  categories?: string[],
  gender?: string[],
) => {
  try {
    const pageSize = 9;

    const today = new Date().toISOString().split("T")[0]; // yyyy-MM-dd

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

    const excludeTodayMeeting = Prisma.sql`
      AND NOT EXISTS (
        SELECT 1
        FROM "free_sessions" m
        WHERE
          m."consultantId" = c."cid"
          AND m."date" = ${today}
      )
    `;

    // ---------- COUNT ----------
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT c.id)::bigint AS count
      FROM "consultants" c
      JOIN "discount_consultants" dc
        ON dc."consultantId" = c."cid"
      WHERE
        c."status" = true
        AND dc."discountId" = 5
        AND dc."status" = true
        ${searchWhere}
        ${categoryWhere}
        ${genderWhere}
        ${excludeTodayMeeting}
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
        COUNT(r.id)::bigint AS review_count
      FROM "consultants" c
      JOIN "discount_consultants" dc
        ON dc."consultantId" = c."cid"
      LEFT JOIN "reviews" r
        ON r."consultantId" = c."cid"
      WHERE
        c."status" = true
        AND dc."discountId" = 5
        AND dc."status" = true
        ${searchWhere}
        ${categoryWhere}
        ${genderWhere}
        ${excludeTodayMeeting}
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
