"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
import moment from "moment";
import { startOfDay } from "date-fns";

// prisma types
import {
  ApprovalState,
  ConsultantState,
  CouponState,
  CouponType,
  CouponVisibility,
} from "@/lib/generated/prisma/client";

// lib
import { timeZone } from "@/lib/site/time";
import { CouponConsultant } from "@/types/layout";

// get all published coupons
export const getPublishedCoupons = async () => {
  try {
    const coupon = await prisma.coupon.findMany({
      where: { status: CouponState.PUBLISHED },
      select: { discount: true },
    });
    return coupon;
  } catch {
    return null;
  }
};

// get certian coupon
export const applyCoupon = async (user: string, code: string, cid: number) => {
  try {
    // get a couon by code
    const coupon = await prisma.coupon.findUnique({
      where: { status: CouponState.PUBLISHED, code },
    });

    // if not exist
    if (!coupon)
      return { state: false, message: "عذراً، الكود الذي أدخلته غير صحيح." };

    // check if coupon belong to this consultant
    if (coupon.consultantId !== cid && coupon.type === CouponType.CONSULTANT)
      return { state: false, message: "هذا الكود مخصص لمستشار آخر." };

    // if user not sign
    if (user === "temp" && coupon.limits !== null)
      return {
        state: false,
        message: "يجب تسجيل الدخول أو إنشاء حساب لاستخدام هذا الكوبون.",
      };

    // check dates start_at and expire_at
    if (coupon.starts_at || coupon.expires_at) {
      //  time zone
      const { date, time } = timeZone();

      // now
      const now = moment(`${date}T${time}`);

      // start at
      if (coupon.starts_at && !now.isSameOrAfter(moment(coupon.starts_at)))
        return { state: false, message: "الكوبون لم يبدأ بعد" };

      // end at
      if (coupon.expires_at && !now.isSameOrBefore(moment(coupon.expires_at)))
        return { state: false, message: "انتهت صلاحية الكوبون" };
    }

    // user limits
    const userUsageCount = coupon.users.filter((u) => u === user).length;

    // if limits exceeded
    if (coupon.limits !== null && userUsageCount >= coupon.limits)
      return {
        state: false,
        message: "لقد استخدمت  الحد المسموح به من هذا الكوبون.",
      };

    // return
    return {
      state: true,
      discount: coupon.discount,
      code: coupon.code,
      message: "تم تطبيق الخصم",
    };
  } catch {
    // return
    return { state: false, message: "الكود غير صالح" };
  }
};

// update a coupon usage
export const saveACoupon = async (user: string, code: string, pid: string) => {
  try {
    // update user
    const coupon = await prisma.coupon.update({
      where: { code },
      data: { users: { push: user } },
      select: {
        discount: true,
        code: true,
        type: true,
      },
    });

    // save in used coupons
    await prisma.usedCoupon.create({
      data: {
        paymentId: pid,
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
      },
      select: { discount: true },
    });

    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// get consultants coupons
export const getCouponByCode = async (code: string) => {
  try {
    // coupons
    const coupons = await prisma.coupon.findUnique({
      where: { code },
    });

    // return
    return coupons;
  } catch {
    return null;
  }
};

// get consultants coupons
export const getConsultantsCoupons = async (consultantId: number) => {
  try {
    // coupons
    const coupons = await prisma.coupon.findMany({
      where: { consultantId },
      orderBy: { created_at: "desc" },
    });

    // return
    return coupons;
  } catch {
    return [];
  }
};

// get consultants coupons
export const deleteConsultantsCoupon = async (code: string) => {
  try {
    // coupons
    await prisma.coupon.delete({
      where: { code },
    });

    // return
    return true;
  } catch {
    return null;
  }
};

// create consultants coupons
export const createConsultantsCoupon = async (
  consultantId: number,
  code: string,
  discount: number,
  limits: number,
  startAt: string,
  endAt: string | null,
  isPublic: boolean
) => {
  try {
    // check if exist
    const exist = await getCouponByCode(code);

    // validate
    if (exist) return null;

    // coupons
    const coupons = await prisma.coupon.create({
      data: {
        consultantId,
        code,
        discount,
        status: CouponState.PUBLISHED,
        type: CouponType.CONSULTANT,
        limits: limits === 0 ? null : limits,
        visibility: isPublic
          ? CouponVisibility.PUBLIC
          : CouponVisibility.PRIVATE,
        starts_at: startOfDay(startAt),
        expires_at: endAt ? startOfDay(endAt) : null,
      },
    });

    // return
    return coupons;
  } catch {
    // return
    return null;
  }
};

export async function getCouponsForHome(): Promise<CouponConsultant[]> {
  // get coupons
  try {
    // prisma query
    const coupons = await prisma.$queryRaw<CouponConsultant[]>`
    SELECT 
      c.*,
      json_build_object(
        'name', co.name,
        'image', co.image,
        'category', co.category,
        'gender', co.gender,
        'rate', co.rate
      ) AS consultant
    FROM coupons c
    JOIN consultants co 
      ON co.cid = c."consultantId"
    WHERE 
      co.status = true
      AND co."statusA" = ${ConsultantState.PUBLISHED}::"ConsultantState"
      AND co.approved = ${ApprovalState.APPROVED}::"ApprovalState"
      AND c.status = ${CouponState.PUBLISHED}::"CouponState"
      AND c.visibility = ${CouponVisibility.PUBLIC}::"CouponVisibility"
      AND (c.starts_at IS NULL OR c.starts_at::date <= CURRENT_DATE)
    AND (c.expires_at IS NULL OR c.expires_at::date >= CURRENT_DATE)
  ORDER BY RANDOM()
    LIMIT 10;
  `;

    // return
    return coupons;
  } catch {
    // return
    return [];
  }
}

export async function getAvailableCoupons(
  today: Date
): Promise<CouponConsultant[]> {
  try {
    // get coupons
    const coupons = await prisma.$queryRaw<CouponConsultant[]>`
    SELECT 
      c.*,
      json_build_object(
        'name', co.name,
        'image', co.image,
        'category', co.category,
        'gender', co.gender,
        'rate', co.rate
      ) AS consultant
    FROM coupons c
    JOIN consultants co 
      ON co.cid = c."consultantId"
    WHERE 
      co.status = true
      AND co."statusA" = ${ConsultantState.PUBLISHED}::"ConsultantState"
      AND co.approved = ${ApprovalState.APPROVED}::"ApprovalState"
      AND c.status = ${CouponState.PUBLISHED}::"CouponState"
      AND c.visibility = ${CouponVisibility.PUBLIC}::"CouponVisibility"
      AND (c.starts_at IS NULL OR DATE(c.starts_at) <= DATE(${today}))
      AND (c.expires_at IS NULL OR DATE(c.expires_at) >= DATE(${today}))
    ORDER BY RANDOM()
  `;

    // return
    return coupons;
  } catch {
    // return
    return [];
  }
}
