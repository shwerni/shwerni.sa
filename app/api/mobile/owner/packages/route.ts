// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerPackages, type OwnerPackage } from "@/data/mobile/owner-packages";

// constants
import { PACKAGE_SESSION_COUNTS } from "@/constants/packages";

// the package rules the app's form needs (the website's package form uses the same)
const PACKAGE_MIN_COST = 100;
const PACKAGE_MAX_ACTIVE = 3;

interface OwnerPackages {
  packages: OwnerPackage[];
  counts: number[];
  minCost: number;
  maxActive: number;
}

// the approved owner's packages and the rules to add or change one
export const GET = createGetRoute<OwnerPackages>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    return {
      packages: await getOwnerPackages(consultant.cid),
      counts: [...PACKAGE_SESSION_COUNTS],
      minCost: PACKAGE_MIN_COST,
      maxActive: PACKAGE_MAX_ACTIVE,
    };
  },
  { errorMessage: "failed to fetch" },
);
