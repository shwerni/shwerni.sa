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
import {
  checkPrices,
  effectiveDurations,
  firstPriceError,
  packageFloor,
  packageFloorLabel,
  readCosts,
} from "@/utils/pricing";

// pricing
import { getPricingSettings } from "@/data/admin/settings/pricing";
import { consultantPriceData } from "@/data/consultant-prices";
import { purgeConsultantPricing } from "@/lib/cache/consultant-pricing";
import { PACKAGE_SESSION_MINUTES } from "@/constants/pricing";

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

/**
 * a consultant's packages as clients see them (his page, the app): getConsultantsPackages' where,
 * plus his "disable all packages" switch off. his own pages keep getConsultantsPackages, so he
 * still sees and edits them while they're hidden
 * @param consultantId the consultant
 * @param status isActive filter (undefined: both)
 */
export async function getClientPackages(consultantId: number, status?: boolean) {
  return await prisma.package.findMany({
    where: {
      consultantId,
      isActive: status,
      consultant: { is: { centerId: null, packagesDisabled: false } },
    },
  });
}

/**
 * the "disable all packages" switch: hides and stops selling every package of his, without
 * touching them (they come back unchanged). packages already sold keep their next-session picks
 * @param cid the own consultant (from the action / route session)
 * @param disabled the switch
 */
export async function setConsultantPackagesDisabled(cid: number, disabled: boolean) {
  try {
    const updated = await prisma.consultant.update({
      where: { cid },
      data: { packagesDisabled: disabled },
      select: { centerId: true },
    });
    purgeConsultantPricing(cid, updated.centerId);
    revalidatePath("/packages");
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * a consultant's package floors: for each session count, the lowest price a package may be saved
 * at (packageFloor: his 45 price × sessions, less the settings' maxPackageDiscountPercent)
 * @param sessionPrice his 45-minute package session price
 * @param maxDiscountPercent the cached settings' maxPackageDiscountPercent
 */
export const packageFloors = (sessionPrice: number, maxDiscountPercent: number) =>
  Object.fromEntries(
    PACKAGE_SESSION_COUNTS.map((count) => [count, packageFloor(sessionPrice, count, maxDiscountPercent)]),
  ) as Record<number, number>;

// the packages page's price fields: the consultant's own single-session lengths, plus the package
// session length (45) while he has an active package, even when it isn't one of his lengths
export const basePriceFields = (durations: readonly number[], packagesEnabled: boolean) =>
  [...new Set([...durations, ...(packagesEnabled ? [PACKAGE_SESSION_MINUTES] : [])])].sort(
    (a, b) => a - b,
  );

/**
 * the packages page's price save, checked on the server: the fields come from the database (his
 * override and his active packages), each price by checkPrices against the cached settings (a new
 * or changed price meets its minimum; an unchanged low one is kept). costs json + columns, then
 * the price caches are purged. never Consultant.durations
 * @param cid the own consultant (from the action's session)
 * @param submitted the prices sent ("30" → price)
 */
export async function updateConsultantBaseCosts(
  cid: number,
  submitted: Record<string, unknown>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const [consultant, settings] = await Promise.all([
      prisma.consultant.findUnique({
        where: { cid },
        select: {
          cost30: true,
          cost45: true,
          cost60: true,
          costs: true,
          durations: true,
          centerId: true,
          packages: { where: { isActive: true }, select: { id: true }, take: 1 },
        },
      }),
      getPricingSettings(),
    ]);
    if (!consultant) return { success: false };

    const fields = basePriceFields(
      effectiveDurations(settings, consultant.durations),
      consultant.packages.length > 0,
    );
    const prices = checkPrices(settings, fields, submitted, readCosts(consultant));
    if (!prices.ok) return { success: false, message: firstPriceError(prices.errors) };

    await prisma.consultant.update({
      where: { cid },
      data: consultantPriceData(consultant.costs, prices.costs),
    });

    // Refresh the page data
    revalidatePath("/dashboard/consultant");
    purgeConsultantPricing(cid, consultant.centerId);
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * create or update a specific package (Upsert). the maximum discount is checked here, so the website
 * and the app both get it: a new package, a changed price or an activation must be at least its
 * floor (packageFloor, from his 45 price now and the cached settings). deactivating, or saving an
 * existing package unchanged, is always allowed: an existing package below the floor keeps selling
 * until he edits it
 */
export async function upsertConsultantPackage(
  consultantId: number,
  count: number,
  cost: number,
  isActive: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const [consultant, existing, settings] = await Promise.all([
      prisma.consultant.findUnique({
        where: { cid: consultantId },
        select: { cost30: true, cost45: true, cost60: true, costs: true },
      }),
      prisma.package.findUnique({
        where: { consultantId_count: { consultantId, count } },
        select: { cost: true, isActive: true },
      }),
      getPricingSettings(),
    ]);
    if (!consultant) return { success: false };

    const edited =
      !existing || existing.cost !== cost || (isActive && !existing.isActive);
    const floor = packageFloor(
      readCosts(consultant)[String(PACKAGE_SESSION_MINUTES)],
      count,
      settings.maxPackageDiscountPercent,
    );
    if (edited && cost < floor) {
      return { success: false, message: packageFloorLabel(floor) };
    }

    // the upsert and the "max 3 active" switch-off in one transaction, so the list never
    // ends with more than 3 active packages
    await prisma.$transaction(async (tx) => {
      await tx.package.upsert({
        where: { consultantId_count: { consultantId, count } },
        update: { cost, isActive },
        create: { consultantId, count, cost, isActive },
      });

      // if activating, enforce max 3 active packages
      if (isActive) {
        const activePackages = await tx.package.findMany({
          where: { consultantId, isActive: true },
          orderBy: { updated_at: "asc" }, // oldest updated = last one toggled on
          select: { id: true },
        });

        // if more than 3 active, deactivate the oldest ones
        if (activePackages.length > 3) {
          const toDeactivate = activePackages
            .slice(0, activePackages.length - 3) // everything except the 3 most recent
            .map((p) => p.id);

          await tx.package.updateMany({
            where: { id: { in: toDeactivate } },
            data: { isActive: false },
          });
        }
      }
    });

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
      AND c."packagesDisabled" = false
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
