import "server-only";
// prisma db
import { prismaAll } from "@/lib/database/db";

// prisma data
import { publicCenterConsultant } from "@/data/center/centers";

// prisma types
import {
  Categories,
  Gender,
  GenderPreference,
} from "@/lib/generated/prisma/enums";

// prisma drops undefined filters, so a bad center id must never reach a query
const assertCenterId = (ceid: number) => {
  if (!Number.isFinite(ceid)) throw new Error("invalid center id");
};

// the consultant grid of one center
export const getCenterConsultants = async (ceid: number) => {
  assertCenterId(ceid);
  try {
    return await prismaAll.consultant.findMany({
      where: { centerId: ceid, ...publicCenterConsultant },
      orderBy: { sort_key: "asc" },
      select: {
        cid: true,
        name: true,
        title: true,
        image: true,
        gender: true,
        category: true,
        rate: true,
      },
    });
  } catch {
    return [];
  }
};

export type CenterConsultantItem = Awaited<
  ReturnType<typeof getCenterConsultants>
>[number];

export type CenterConsultant = {
  cid: number;
  name: string;
  title: string;
  image: string | null;
  gender: Gender;
  category: Categories;
  rate: number;
  nabout: string;
  nexperiences: string[];
  neducation: string[];
  preference: GenderPreference;
  years: number;
  reviews: number;
  specialties: string[];
};

// the center version of getConsultant: one public consultant of this center only.
// public columns only (no phone, commission or admin notes)
export const getCenterConsultant = async (
  ceid: number,
  cid: number,
): Promise<CenterConsultant | null> => {
  assertCenterId(ceid);
  if (!Number.isFinite(cid)) return null;

  try {
    const rows = await prismaAll.$queryRaw<CenterConsultant[]>`
      SELECT
        c.cid,
        c.name,
        c.title,
        c.image,
        c.gender,
        c.category,
        c.rate,
        c.nabout,
        c.nexperiences,
        c.neducation,
        c.preference,
        GREATEST(DATE_PART('year', AGE(NOW(), c.seniority))::int, 1) AS years,
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
        AND c."centerId" = ${ceid}
        AND c.status = true
        AND c."statusA" = 'PUBLISHED'
        AND c.approved = 'APPROVED'
      GROUP BY c.id, c.cid
    `;

    return rows[0] ?? null;
  } catch {
    return null;
  }
};
