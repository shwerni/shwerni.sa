// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerDiscounts, type OwnerDiscount } from "@/data/mobile/owner-discounts";

interface OwnerDiscounts {
  discounts: OwnerDiscount[];
}

// the platform's discount campaigns, newest first, with whether the approved owner joined each
export const GET = createGetRoute<OwnerDiscounts>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return { discounts: await getOwnerDiscounts(consultant.cid) };
  },
  { errorMessage: "failed to fetch" },
);
