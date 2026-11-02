// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerCoupons, type OwnerCoupon } from "@/data/mobile/owner-coupons";

interface OwnerCoupons {
  coupons: OwnerCoupon[];
}

// the approved owner's own coupons, newest first (never the users array)
export const GET = createGetRoute<OwnerCoupons>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return { coupons: await getOwnerCoupons(consultant.cid) };
  },
  { errorMessage: "failed to fetch" },
);
