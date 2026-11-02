// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createDeleteRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { deleteConsultantsCoupon } from "@/data/coupon";
import { getOwnerCouponCode } from "@/data/mobile/owner-coupons";

interface Params {
  id: string;
}

interface OwnerCouponDeleted {
  id: string;
}

// delete one of the approved owner's coupons for good, like the website (another consultant's is a
// 404). payments keep their UsedCoupon snapshot, so past orders and dues don't change
export const DELETE = createDeleteRoute<OwnerCouponDeleted, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const { id } = await context.params;

    const code = await getOwnerCouponCode(consultant.cid, id);
    if (!code) throw new HttpError("not found", 404);

    if (!(await deleteConsultantsCoupon(code))) {
      throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);
    }

    return { id };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
