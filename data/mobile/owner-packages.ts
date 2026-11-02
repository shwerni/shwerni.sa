import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// GET /api/mobile/owner/packages -> packages
export interface OwnerPackage {
  count: number;
  cost: number;
  isActive: boolean;
  updatedAt: string;
}

/**
 * the consultant's packages, by count: the where of the website's getConsultantsPackages
 * (platform-only, centers spec §4) with only the fields the app shows
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerPackages = async (cid: number): Promise<OwnerPackage[]> => {
  const rows = await prisma.package.findMany({
    where: {
      consultantId: cid,
      NOT: { consultant: { is: { centerId: { not: null } } } },
    },
    select: { count: true, cost: true, isActive: true, updated_at: true },
    orderBy: { count: "asc" },
  });

  return rows.map((row) => ({
    count: row.count,
    cost: row.cost,
    isActive: row.isActive,
    updatedAt: row.updated_at.toISOString(),
  }));
};
