// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { parseIntId } from "@/lib/api/routes/parse-id";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import {
  getOwnerDiscount,
  type OwnerDiscountDetails,
} from "@/data/mobile/owner-discounts";

interface Params {
  did: string;
}

// one platform campaign for the approved owner, every price and earning computed on the server.
// a missing, hidden or center campaign is a 404
export const GET = createGetRoute<OwnerDiscountDetails, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const did = parseIntId((await context.params).did);
    if (did === null) throw new HttpError("not found", 404);

    const details = await getOwnerDiscount(consultant.cid, did);
    if (!details) throw new HttpError("not found", 404);

    return details;
  },
  { errorMessage: "failed to fetch" },
);
