// prisma types
import { CouponType } from "@/lib/generated/prisma/enums";

// the coupon rules shared by the preview (the coupon form, the app's quote) and Pay (quoteBooking):
// one verdict, so the discount the client sees and the one charged can't differ

// why a coupon doesn't apply
export type CouponReason =
  | "not_found"
  | "other_consultant"
  | "login_required"
  | "not_started"
  | "expired"
  | "limit_reached"
  | "not_allowed"
  | "discounted"
  | "disabled"
  | "changed"
  | "error";

// the client's message for each reason
export const COUPON_MESSAGES: Record<CouponReason, string> = {
  not_found: "عذراً، الكود الذي أدخلته غير صحيح.",
  other_consultant: "هذا الكود مخصص لمستشار آخر.",
  login_required: "يجب تسجيل الدخول أو إنشاء حساب لاستخدام هذا الكوبون.",
  not_started: "الكوبون لم يبدأ بعد",
  expired: "انتهت صلاحية الكوبون",
  limit_reached: "لقد استخدمت الحد المسموح به من هذا الكوبون.",
  not_allowed: "لا يمكن استخدام الكوبون مع هذا الحجز",
  discounted: "لا يمكن استخدام الكوبون مع سعر عليه خصم بالفعل",
  disabled: "الكوبونات غير متاحة حالياً",
  changed:
    "تغيّر الخصم منذ تطبيق الكوبون، برجاء إزالة الكوبون أو تطبيقه مرة أخرى",
  error: "تعذّر التحقق من الكوبون، برجاء المحاولة مرة أخرى",
};

// the booking a coupon is checked against
export interface CouponBooking {
  order: string; // "consultant" | "instant" | "program"
  cid: number;
  package?: string | null;
  // the booked duration already has a campaign price
  durationDiscounted: boolean;
  // finance.couponEnabled
  couponsEnabled: boolean;
}

// what the database says, gathered by validateCoupon (data/coupon.ts)
export interface CouponFacts {
  coupon: {
    code: string;
    discount: number;
    type: CouponType;
    consultantId: number | null;
    centerId: number | null;
    limits: number | null;
    starts_at: Date | null;
    expires_at: Date | null;
  } | null;
  // the booked consultant's center (null: a platform consultant)
  ownerCenterId: number | null;
  user: string; // the session's user id, "temp" for a guest
  now: Date;
  // this user's PAID uses of the coupon. the limit is per user, so only the user's own orders count,
  // and their own unfinished checkouts don't hold it: a retry after a failed card or going back gets
  // the coupon at once
  usage: { paid: number };
}

export type CouponVerdict =
  | { ok: true; code: string; percent: number }
  | { ok: false; reason: CouponReason; message: string };

export const couponRefused = (reason: CouponReason): CouponVerdict => ({
  ok: false,
  reason,
  message: COUPON_MESSAGES[reason],
});

// codes are stored in capitals; the client may type them in any case, with spaces around
export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();

// the booking's own rule: coupons only on a single session or an instant one, never on a program,
// a package or a price that already has a campaign discount
export function bookingCouponRule(booking: CouponBooking): CouponReason | null {
  if (!booking.couponsEnabled) return "disabled";
  if (booking.order !== "consultant" && booking.order !== "instant")
    return "not_allowed";
  if (booking.package) return "not_allowed";
  if (booking.durationDiscounted) return "discounted";
  return null;
}

// the verdict: the booking's rule first, then the coupon's own (owner, center, guest, dates, limit)
export function couponVerdict(
  booking: CouponBooking,
  facts: CouponFacts,
): CouponVerdict {
  const rule = bookingCouponRule(booking);
  if (rule) return couponRefused(rule);

  const coupon = facts.coupon;
  if (!coupon) return couponRefused("not_found");

  // a consultant's coupon is for that consultant only
  if (
    coupon.type === CouponType.CONSULTANT &&
    coupon.consultantId !== booking.cid
  )
    return couponRefused("other_consultant");

  // centers spec §8: coupon.centerId must equal the consultant's centerId (null matches null), so
  // platform coupons never reach center consultants and vice versa. a CENTER coupon can narrow to
  // one of its center's consultants through consultantId
  if ((coupon.centerId ?? null) !== (facts.ownerCenterId ?? null))
    return couponRefused("other_consultant");
  if (
    coupon.type === CouponType.CENTER &&
    coupon.consultantId !== null &&
    coupon.consultantId !== booking.cid
  )
    return couponRefused("other_consultant");

  // a limited coupon needs an account (its uses are counted per user)
  if (facts.user === "temp" && coupon.limits !== null)
    return couponRefused("login_required");

  if (coupon.starts_at && facts.now < coupon.starts_at)
    return couponRefused("not_started");
  if (coupon.expires_at && facts.now > coupon.expires_at)
    return couponRefused("expired");

  // per-user limit: this user's PAID uses
  if (coupon.limits !== null && facts.usage.paid >= coupon.limits)
    return couponRefused("limit_reached");

  return { ok: true, code: coupon.code, percent: coupon.discount };
}
