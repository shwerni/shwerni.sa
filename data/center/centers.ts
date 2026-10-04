import "server-only";
// prisma db
import { prismaAll } from "@/lib/database/db";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ApprovalState,
  CenterState,
  ConsultantState,
} from "@/lib/generated/prisma/enums";

// a consultant that may appear on a public center page
export const publicCenterConsultant = {
  status: true,
  statusA: ConsultantState.PUBLISHED,
  approved: ApprovalState.APPROVED,
} satisfies Prisma.ConsultantWhereInput;

// what the public center page shows. never the platform rate, sort key or legal numbers
const centerPublicSelect = {
  ceid: true,
  slug: true,
  status: true,
  name: true,
  description: true,
  logo: true,
  cover: true,
  gallery: true,
  themeKey: true,
  themeVars: true,
  city: true,
  district: true,
  address: true,
  lat: true,
  lng: true,
  phone: true,
  whatsapp: true,
  email: true,
  preference: true,
  amenities: true,
  policy: true,
  workHours: {
    select: { day: true, open: true, close: true },
    orderBy: [{ day: "asc" }, { open: "asc" }],
  },
} satisfies Prisma.CenterSelect;

export type PublicCenter = Prisma.CenterGetPayload<{
  select: typeof centerPublicSelect;
}>;

// published centers for /centers, with their public consultant count
export const getPublishedCenters = async () => {
  try {
    return await prismaAll.center.findMany({
      where: { status: CenterState.PUBLISHED },
      orderBy: { sort_key: "asc" },
      select: {
        ceid: true,
        slug: true,
        name: true,
        description: true,
        logo: true,
        city: true,
        district: true,
        _count: {
          select: { consultants: { where: publicCenterConsultant } },
        },
      },
    });
  } catch {
    return [];
  }
};

export type CenterListItem = Awaited<
  ReturnType<typeof getPublishedCenters>
>[number];

// a published center by slug (the public page)
export const getPublishedCenterBySlug = async (
  slug: string,
): Promise<PublicCenter | null> => {
  try {
    return await prismaAll.center.findFirst({
      where: { slug, status: CenterState.PUBLISHED },
      select: centerPublicSelect,
    });
  } catch {
    return null;
  }
};

// a center by slug whatever its status: admin preview only, the caller checks the role
export const getCenterBySlugAnyStatus = async (
  slug: string,
): Promise<PublicCenter | null> => {
  try {
    return await prismaAll.center.findUnique({
      where: { slug },
      select: centerPublicSelect,
    });
  } catch {
    return null;
  }
};

// published centers with their public consultants, for the sitemap
export const getSitemapCenters = async () => {
  try {
    return await prismaAll.center.findMany({
      where: { status: CenterState.PUBLISHED },
      select: {
        slug: true,
        updated_at: true,
        consultants: {
          where: publicCenterConsultant,
          select: { cid: true, updated_at: true },
        },
      },
    });
  } catch {
    return [];
  }
};
