// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import {
  createGetRoute,
  createPatchRoute,
  createPutRoute,
} from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { setConsultantPackagesDisabled, upsertConsultantPackage } from "@/data/packages";
import {
  getOwnerPackageRules,
  getOwnerPackages,
  type OwnerPackage,
} from "@/data/mobile/owner-packages";

// constants
import { PACKAGE_SESSION_COUNTS } from "@/constants/packages";

// the package rules the app's form needs (the website's package form uses the same)
const PACKAGE_MAX_ACTIVE = 3;
// the cost column is an Int
const PACKAGE_MAX_COST = 2_147_483_647;

interface OwnerPackages {
  // each package with its floor, and whether it's saved below it (it keeps selling until edited)
  packages: (OwnerPackage & { floor: number; belowFloor: boolean })[];
  counts: number[];
  // the smallest floor, kept for the app's existing form (the floors are per session count now)
  minCost: number;
  maxActive: number;
  // his "disable all packages" switch: hidden from clients and not bookable while true
  packagesDisabled: boolean;
  // his 45-minute package session price, the settings' max package discount and each count's floor
  packageSessionPrice: number;
  maxDiscountPercent: number;
  floors: Record<number, number>;
}

// an allowed session count and a whole-riyal price; its floor (the max discount) is checked by
// upsertConsultantPackage, the same save as the website's
const PackageSchema = z.object({
  count: z
    .number()
    .int()
    .refine((count) => PACKAGE_SESSION_COUNTS.includes(count)),
  cost: z.number().int().min(1).max(PACKAGE_MAX_COST),
  isActive: z.boolean(),
});

const SwitchSchema = z.object({ disabled: z.boolean() });

/**
 * the packages list with its rules, as GET answers it
 * @param cid the owner's own consultant id
 */
const packagesResponse = async (cid: number): Promise<OwnerPackages> => {
  const [packages, rules] = await Promise.all([getOwnerPackages(cid), getOwnerPackageRules(cid)]);
  return {
    packages: packages.map((pkg) => {
      const floor = rules.floors[pkg.count];
      return { ...pkg, floor, belowFloor: pkg.isActive && pkg.cost < floor };
    }),
    counts: [...PACKAGE_SESSION_COUNTS],
    minCost: Math.min(...PACKAGE_SESSION_COUNTS.map((count) => rules.floors[count])),
    maxActive: PACKAGE_MAX_ACTIVE,
    ...rules,
  };
};

// the approved owner's packages and the rules to add or change one
export const GET = createGetRoute<OwnerPackages>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return packagesResponse(consultant.cid);
  },
  { errorMessage: "failed to fetch" },
);

// add or update one package (by its session count) with the website's save: the floor check, the
// upsert and the "max 3 active" switch-off in one place. returns the whole list, since switching one
// on can switch the oldest active one off
export const PUT = createPutRoute<OwnerPackages>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = PackageSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const { count, cost, isActive } = parsed.data;

    const saved = await upsertConsultantPackage(consultant.cid, count, cost, isActive);
    // below the floor: 400 with "أقل سعر مسموح لهذه الباقة …"
    if (!saved.success && saved.message) throw new HttpError(saved.message, 400);
    if (!saved.success) throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);

    return packagesResponse(consultant.cid);
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);

// his "disable all packages" switch: { disabled }. his packages are kept unchanged
export const PATCH = createPatchRoute<OwnerPackages>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = SwitchSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    const saved = await setConsultantPackagesDisabled(consultant.cid, parsed.data.disabled);
    if (!saved.success) throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);

    return packagesResponse(consultant.cid);
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
