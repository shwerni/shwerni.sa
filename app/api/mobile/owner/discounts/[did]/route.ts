// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { timeZone } from "@/utils/date";
import { HttpError } from "@/lib/api/http-error";
import { parseIntId } from "@/lib/api/routes/parse-id";
import { createGetRoute, createPatchRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { toggleDiscountState } from "@/data/discounts";
import {
  getJoinableDiscount,
  getOwnerDiscount,
  type OwnerDiscountDetails,
} from "@/data/mobile/owner-discounts";

interface Params {
  did: string;
}

interface OwnerDiscountJoined {
  joined: boolean;
}

const JoinSchema = z.object({ joined: z.boolean() });

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

// join or leave a platform campaign with the website's toggleDiscountState. leaving is allowed any
// time (bookings already made keep the price stored on their payment); joining a campaign that has
// ended is refused. a missing, hidden or center campaign is a 404
export const PATCH = createPatchRoute<OwnerDiscountJoined, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const did = parseIntId((await context.params).did);
    if (did === null) throw new HttpError("not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const { joined } = parsed.data;

    const discount = await getJoinableDiscount(did);
    if (!discount) throw new HttpError("not found", 404);
    // "now" as the site's pricing reads it (resolveConsultantPricing), so it agrees with GET's running
    if (joined && discount.endDate < timeZone().iso) {
      throw new HttpError("انتهى هذا الخصم", 400);
    }

    if (!(await toggleDiscountState(did, joined, consultant.cid))) {
      throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);
    }

    return { joined };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
