import "server-only";
// React & Next
import { revalidatePath } from "next/cache";

// prisma db
import prisma from "@/lib/database/db";
import { Prisma } from "@/lib/generated/prisma/client";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";

// constants
import {
  PACKAGE_SESSION_COUNTS,
  PUBLIC_PACKAGES_PAGE_SIZE,
  PackageSort,
} from "@/constants/packages";

// utils
import {
  ARABIC_FOLD_FROM,
  ARABIC_FOLD_TO,
  ARABIC_MARKS,
  escapeLike,
  normalizeArabic,
} from "@/utils/arabic";

// get consultant packages
export async function getConsultantsPackages(
  consultantId: number,
  status?: boolean,
) {
  return await prisma.package.findMany({
    where: {
      consultantId,
      isActive: status,
      // packages are platform-only in v1 (centers spec §4)
      NOT: { consultant: { is: { centerId: { not: null } } } },
    },
  });
}

export async function updateConsultantBaseCosts(
  cid: number,
  cost30: number,
  cost45: number,
  cost60: number,
) {
  try {
    await prisma.consultant.update({
      where: { cid },
      data: {
        cost30,
        cost45,
        cost60,
      },
    });

    // Refresh the page data
    revalidatePath("/dashboard/consultant");
    return { success: true };
  } catch {
    return { success: false };
  }
}

// create or update a specific package (Upsert)
export async function upsertConsultantPackage(
  consultantId: number,
  count: number,
  cost: number,
  isActive: boolean,
) {
  try {
    await prisma.package.upsert({
      where: { consultantId_count: { consultantId, count } },
      update: { cost, isActive },
      create: { consultantId, count, cost, isActive },
    });

    // if activating, enforce max 3 active packages
    if (isActive) {
      const activePackages = await prisma.package.findMany({
        where: { consultantId, isActive: true },
        orderBy: { updated_at: "asc" }, // oldest updated = last one toggled on
        select: { id: true },
      });

      // if more than 3 active, deactivate the oldest ones
      if (activePackages.length > 3) {
        const toDeactivate = activePackages
          .slice(0, activePackages.length - 3) // everything except the 3 most recent
          .map((p) => p.id);

        await prisma.package.updateMany({
          where: { id: { in: toDeactivate } },
          data: { isActive: false },
        });
      }
    }

    revalidatePath("/dashboard/consultant");
    return { success: true };
  } catch (error) {
    console.error("Error upserting package:", error);
    return { success: false };
  }
}

// public /packages list (view: one row per package, or one per consultant)
export type PublicPackagesFilters = {
  search: string;
  category: Categories[];
  gender: Gender[];
  sessions: number[];
  sort: PackageSort;
  page: number;
};

type PackageConsultant = {
  cid: number;
  name: string;
  title: string;
  image: string | null;
  rate: number | null;
  gender: Gender;
  category: Categories;
  // the undiscounted 30-minute price: the savings base the booking page uses too
  cost30: number;
  review_count: number;
};

export type PublicPackageItem = PackageConsultant & {
  id: string;
  count: number;
  cost: number;
};

export type PublicPackageConsultantItem = PackageConsultant & {
  packages: { id: string; count: number; cost: number }[];
};

type Paged<T> = { items: T[]; total: number; pages: number; page: number };

// shared from + where: active packages of published, approved platform consultants.
// raw sql is not covered by the safe client, so centerId is filtered by hand
function publicPackagesWhere(f: PublicPackagesFilters) {
  const q = normalizeArabic(f.search);
  const sessions = f.sessions.filter((n) => PACKAGE_SESSION_COUNTS.includes(n));

  // the name normalized like utils/arabic.ts normalizeArabic
  const searchWhere = q
    ? Prisma.sql`AND translate(
          regexp_replace(regexp_replace(lower(c.name), ${ARABIC_MARKS}, '', 'g'), ${"\\s+"}, ' ', 'g'),
          ${ARABIC_FOLD_FROM},
          ${ARABIC_FOLD_TO}
        ) LIKE ${`%${escapeLike(q)}%`}`
    : Prisma.empty;

  const categoryWhere = f.category.length
    ? Prisma.sql`AND c."category" = ANY (${f.category}::"Categories"[])`
    : Prisma.empty;

  const genderWhere = f.gender.length
    ? Prisma.sql`AND c."gender" = ANY (${f.gender}::"Gender"[])`
    : Prisma.empty;

  const sessionsWhere = sessions.length
    ? Prisma.sql`AND p."count" = ANY (${sessions}::int[])`
    : Prisma.empty;

  return Prisma.sql`
    FROM "packages" p
    JOIN "consultants" c ON c."cid" = p."consultantId"
    WHERE p."isActive" = true
      AND c."status" = true
      AND c."statusA" = 'PUBLISHED'
      AND c."approved" = 'APPROVED'
      AND c."centerId" IS NULL
      ${searchWhere}
      ${categoryWhere}
      ${genderWhere}
      ${sessionsWhere}
  `;
}

const consultantColumns = Prisma.sql`
  c."cid",
  c."name",
  c."title",
  c."image",
  c."rate",
  c."gender"::text AS gender,
  c."category"::text AS category,
  c."cost30",
  (
    SELECT COUNT(*)::int
    FROM "reviews" r
    WHERE r."consultantId" = c."cid" AND r."status" = 'PUBLISHED'
  ) AS review_count
`;

// pages from a total, with the requested page clamped into range
function paging(total: number, page: number) {
  const pages = Math.max(1, Math.ceil(total / PUBLIC_PACKAGES_PAGE_SIZE));
  const safePage = Math.min(Math.max(Math.trunc(page) || 1, 1), pages);
  return {
    pages,
    page: safePage,
    offset: (safePage - 1) * PUBLIC_PACKAGES_PAGE_SIZE,
  };
}

// one row per package
export async function getPublicPackages(
  f: PublicPackagesFilters,
): Promise<Paged<PublicPackageItem>> {
  try {
    const from = publicPackagesWhere(f);

    // savings: package price over the same sessions at the 30-minute price (lower = more saved)
    const order = {
      recommended: Prisma.sql`c."sort_key" ASC, p."count" ASC`,
      price_asc: Prisma.sql`p."cost" ASC`,
      price_desc: Prisma.sql`p."cost" DESC`,
      per_session: Prisma.sql`p."cost"::float / p."count" ASC`,
      savings: Prisma.sql`p."cost"::float / NULLIF(c."cost30" * p."count", 0) ASC NULLS LAST`,
      rating: Prisma.sql`c."rate" DESC NULLS LAST, p."cost" ASC`,
    }[f.sort];

    const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count ${from}
    `;
    const { pages, page, offset } = paging(count, f.page);

    const items = await prisma.$queryRaw<PublicPackageItem[]>`
      SELECT p."id", p."count", p."cost", ${consultantColumns}
      ${from}
      ORDER BY ${order}, p."id" ASC
      LIMIT ${PUBLIC_PACKAGES_PAGE_SIZE} OFFSET ${offset}
    `;

    return { items, total: count, pages, page };
  } catch (error) {
    console.error("Error loading public packages:", error);
    return { items: [], total: 0, pages: 1, page: 1 };
  }
}

// one row per consultant, with their matching packages
export async function getPublicPackageConsultants(
  f: PublicPackagesFilters,
): Promise<Paged<PublicPackageConsultantItem>> {
  try {
    const from = publicPackagesWhere(f);

    // each consultant ranks by their best matching package
    const order = {
      recommended: Prisma.sql`c."sort_key" ASC`,
      price_asc: Prisma.sql`MIN(p."cost") ASC`,
      price_desc: Prisma.sql`MAX(p."cost") DESC`,
      per_session: Prisma.sql`MIN(p."cost"::float / p."count") ASC`,
      savings: Prisma.sql`MIN(p."cost"::float / NULLIF(c."cost30" * p."count", 0)) ASC NULLS LAST`,
      rating: Prisma.sql`c."rate" DESC NULLS LAST, MIN(p."cost") ASC`,
    }[f.sort];

    const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT c."cid")::int AS count ${from}
    `;
    const { pages, page, offset } = paging(count, f.page);

    const items = await prisma.$queryRaw<PublicPackageConsultantItem[]>`
      SELECT
        ${consultantColumns},
        json_agg(
          json_build_object('id', p."id", 'count', p."count", 'cost', p."cost")
          ORDER BY p."count" ASC
        ) AS packages
      ${from}
      GROUP BY c."id"
      ORDER BY ${order}, c."cid" ASC
      LIMIT ${PUBLIC_PACKAGES_PAGE_SIZE} OFFSET ${offset}
    `;

    return { items, total: count, pages, page };
  } catch (error) {
    console.error("Error loading public package consultants:", error);
    return { items: [], total: 0, pages: 1, page: 1 };
  }
}
