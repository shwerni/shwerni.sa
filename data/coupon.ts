import "server-only";
// prisma db
import prisma, { prismaAll } from "@/lib/database/db";

// packages
import { parseISO, startOfDay } from "date-fns";

// prisma types
import {
  ApprovalState,
  ConsultantState,
  CouponState,
  CouponType,
  CouponVisibility,
  PaymentState,
} from "@/lib/generated/prisma/client";

// utils
import { timeZone } from "@/utils/date";
import {
  bookingCouponRule,
  couponRefused,
  couponVerdict,
  normalizeCouponCode,
  type CouponBooking,
  type CouponVerdict,
} from "@/utils/coupon";

// types
import { CouponConsultant } from "@/types/layout";

// this user's uses of a coupon: PAID orders only. the limit is per user, so only the user's own
// orders count, and their own unfinished checkouts (NEW, PROCESSING, failed, canceled) don't hold
// it: a retry after a failed card or going back gets the coupon at once (coupon.users gets every
// checkout that was started, so it isn't counted). the user is the order's author; uses before the
// coupon row existed (a re-created code) don't count
const couponUsage = async (
  coupon: { code: string; created_at: Date },
  user: string,
) => {
  const paid = await prisma.usedCoupon.count({
    where: {
      code: coupon.code,
      usedAt: { gte: coupon.created_at },
      payment: {
        payment: PaymentState.PAID,
        order: { is: { author: user } },
      },
    },
  });
  return { paid };
};

// a coupon against a booking: the one check behind the coupon form's preview and Pay (through
// quoteBooking), so they can't disagree. the rules are couponVerdict (utils/coupon.ts)
export const validateCoupon = async (
  user: string,
  rawCode: string,
  booking: CouponBooking,
): Promise<CouponVerdict> => {
  // the booking's own rule first (no database needed)
  const rule = bookingCouponRule(booking);
  if (rule) return couponRefused(rule);

  try {
    const code = normalizeCouponCode(rawCode);
    const coupon = code
      ? await prisma.coupon.findUnique({
          where: { status: CouponState.PUBLISHED, code },
        })
      : null;
    if (!coupon) return couponRefused("not_found");

    // the consultant's center (unfiltered: center consultants too)
    const owner = await prismaAll.consultant.findUnique({
      where: { cid: booking.cid },
      select: { centerId: true },
    });

    // uses count only for a limited coupon and a signed-in user (guests are refused a limited one)
    const usage =
      coupon.limits !== null && user !== "temp"
        ? await couponUsage(coupon, user)
        : { paid: 0 };

    // riyadh wall time, as the coupon's dates are compared since the start
    const { date, time } = timeZone();

    return couponVerdict(booking, {
      coupon,
      ownerCenterId: owner?.centerId ?? null,
      user,
      now: parseISO(`${date}T${time}`),
      usage,
    });
  } catch {
    return couponRefused("error");
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
  isPublic: boolean,
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
      AND co."centerId" IS NULL
      AND c."centerId" IS NULL
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

export const getCoupons = async (page: number = 1, search: string = "") => {
  try {
    const pageSize = 12;
    const now = new Date();

    const where = {
      status: CouponState.PUBLISHED,
      visibility: CouponVisibility.PUBLIC,
      consultant: search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : undefined,
      // platform coupons only
      centerId: null,
      AND: [
        // not tied to a center consultant (coupons without a consultant stay)
        { NOT: { consultant: { is: { centerId: { not: null } } } } },
        // starts_at null or in the past means it has started
        { OR: [{ starts_at: null }, { starts_at: { lte: now } }] },
        // expires_at null or in the future means it hasn't expired
        { OR: [{ expires_at: null }, { expires_at: { gte: now } }] },
      ],
    };

    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        include: {
          consultant: {
            select: {
              cid: true,
              rate: true,
              name: true,
              image: true,
              gender: true,
              category: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), pages);

    return {
      coupons: coupons as CouponConsultant[],
      total,
      pages,
      page: safePage,
    };
  } catch {
    return { coupons: [], total: 0, pages: 1, page: 1 };
  }
};
