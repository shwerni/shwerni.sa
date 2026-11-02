import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import type {
  CouponState,
  CouponVisibility,
} from "@/lib/generated/prisma/enums";

// GET /api/mobile/owner/coupons -> coupons
export interface OwnerCoupon {
  id: string;
  code: string;
  discount: number;
  // uses per client; null = unlimited (the website stores an unlimited 0 as null)
  limits: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  visibility: CouponVisibility;
  status: CouponState;
}

/**
 * the consultant's coupons, newest first: the where of the website's getConsultantsCoupons,
 * never the users array (client ids)
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerCoupons = async (cid: number): Promise<OwnerCoupon[]> => {
  const rows = await prisma.coupon.findMany({
    where: { consultantId: cid },
    select: {
      id: true,
      code: true,
      discount: true,
      limits: true,
      starts_at: true,
      expires_at: true,
      visibility: true,
      status: true,
    },
    orderBy: { created_at: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    discount: row.discount,
    limits: row.limits,
    startsAt: row.starts_at?.toISOString() ?? null,
    expiresAt: row.expires_at?.toISOString() ?? null,
    visibility: row.visibility,
    status: row.status,
  }));
};
