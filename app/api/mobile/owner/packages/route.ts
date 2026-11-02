// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute, createPutRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { upsertConsultantPackage } from "@/data/packages";
import { getOwnerPackages, type OwnerPackage } from "@/data/mobile/owner-packages";

// constants
import { PACKAGE_SESSION_COUNTS } from "@/constants/packages";

// the package rules the app's form needs (the website's package form uses the same)
const PACKAGE_MIN_COST = 100;
const PACKAGE_MAX_ACTIVE = 3;
// the cost column is an Int
const PACKAGE_MAX_COST = 2_147_483_647;

interface OwnerPackages {
  packages: OwnerPackage[];
  counts: number[];
  minCost: number;
  maxActive: number;
}

// the website form's rules, checked on the server (the website checks them only in the browser,
// backlog #18): an allowed session count, a whole-riyal price of at least 100
const PackageSchema = z.object({
  count: z
    .number()
    .int()
    .refine((count) => PACKAGE_SESSION_COUNTS.includes(count)),
  cost: z.number().int().min(PACKAGE_MIN_COST).max(PACKAGE_MAX_COST),
  isActive: z.boolean(),
});

/**
 * the packages list with its rules, as GET answers it
 * @param cid the owner's own consultant id
 */
const packagesResponse = async (cid: number): Promise<OwnerPackages> => ({
  packages: await getOwnerPackages(cid),
  counts: [...PACKAGE_SESSION_COUNTS],
  minCost: PACKAGE_MIN_COST,
  maxActive: PACKAGE_MAX_ACTIVE,
});

// the approved owner's packages and the rules to add or change one
export const GET = createGetRoute<OwnerPackages>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return packagesResponse(consultant.cid);
  },
  { errorMessage: "failed to fetch" },
);

// add or update one package (by its session count) with the website's save: the upsert and the
// "max 3 active" switch-off in one transaction. returns the whole list, since switching one on can
// switch the oldest active one off
export const PUT = createPutRoute<OwnerPackages>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = PackageSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const { count, cost, isActive } = parsed.data;

    const saved = await upsertConsultantPackage(consultant.cid, count, cost, isActive);
    if (!saved.success) throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);

    return packagesResponse(consultant.cid);
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
