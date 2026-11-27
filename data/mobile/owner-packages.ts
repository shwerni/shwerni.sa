import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// pricing
import { getPricingSettings } from "@/data/admin/settings/pricing";
import { packageFloors } from "@/data/packages";
import { readCosts } from "@/utils/pricing";
import { PACKAGE_SESSION_MINUTES } from "@/constants/pricing";

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

// the package rules the app's form needs: his switch, his 45 price, the max discount and the floors
export interface OwnerPackageRules {
  packagesDisabled: boolean;
  packageSessionPrice: number;
  maxDiscountPercent: number;
  floors: Record<number, number>;
}

/**
 * the owner's package rules: his "disable all packages" switch, his 45-minute package session price
 * (readCosts), the cached settings' maxPackageDiscountPercent and each session count's floor
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerPackageRules = async (cid: number): Promise<OwnerPackageRules> => {
  const [row, settings] = await Promise.all([
    prisma.consultant.findUnique({
      where: { cid },
      select: { cost30: true, cost45: true, cost60: true, costs: true, packagesDisabled: true },
    }),
    getPricingSettings(),
  ]);
  const sessionPrice = row ? readCosts(row)[String(PACKAGE_SESSION_MINUTES)] : 0;
  return {
    packagesDisabled: row?.packagesDisabled ?? false,
    packageSessionPrice: sessionPrice,
    maxDiscountPercent: settings.maxPackageDiscountPercent,
    floors: packageFloors(sessionPrice, settings.maxPackageDiscountPercent),
  };
};
