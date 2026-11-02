// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute, createPostRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { createConsultantsCoupon } from "@/data/coupon";
import {
  couponCodeExists,
  getOwnerCoupons,
  toOwnerCoupon,
  type OwnerCoupon,
} from "@/data/mobile/owner-coupons";

interface OwnerCoupons {
  coupons: OwnerCoupon[];
}

interface OwnerCouponCreated {
  coupon: OwnerCoupon;
}

// a real calendar day "YYYY-MM-DD"
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const ms = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
  });

// the website form's rules (schemas/consultant couponConsultantSchema), checked on the server:
// the website's action doesn't (backlog #11). a null limit = unlimited (stored as null)
const CouponSchema = z
  .object({
    code: z
      .string()
      .regex(/^[A-Za-z0-9]{6}$/)
      .transform((code) => code.toUpperCase()),
    discount: z.number().min(1).max(50),
    limits: z.number().int().min(1).nullable(),
    startsAt: day,
    expiresAt: day.nullable(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
  })
  .refine((coupon) => coupon.expiresAt === null || coupon.expiresAt > coupon.startsAt);

// the approved owner's own coupons, newest first (never the users array)
export const GET = createGetRoute<OwnerCoupons>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return { coupons: await getOwnerCoupons(consultant.cid) };
  },
  { errorMessage: "failed to fetch" },
);

// create a coupon for the approved owner with the website's createConsultantsCoupon (CONSULTANT,
// PUBLISHED, centerId null); an existing code is a 409
export const POST = createPostRoute<OwnerCouponCreated>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = CouponSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const input = parsed.data;

    // the website's message for a taken code
    const taken = () =>
      new HttpError("هذا الكوبون مستخدم بالفعل, برجاء اختيار كوبون اخر", 409);
    if (await couponCodeExists(input.code)) throw taken();

    const coupon = await createConsultantsCoupon(
      consultant.cid,
      input.code,
      input.discount,
      input.limits ?? 0,
      input.startsAt,
      input.expiresAt,
      input.visibility === "PUBLIC",
    );
    // null: the code was taken in the meantime, or the insert failed
    if (!coupon) {
      if (await couponCodeExists(input.code)) throw taken();
      throw new Error("coupon not created");
    }

    return { coupon: toOwnerCoupon(coupon) };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
