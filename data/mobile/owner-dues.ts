import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState, type CouponType } from "@/lib/generated/prisma/enums";

// utils
import { calculateDues } from "@/utils/admin/dues";

// GET /api/mobile/owner/dues -> orders[]
export interface OwnerDue {
  oid: number;
  type: "SCHEDULED" | "INSTANT" | "PROGRAM";
  createdAt: string;
  dueAt: string;
  done: boolean;
  total: number;
  coupon: { type: CouponType; discount: number } | null;
  afterCoupon: number;
  share: number;
  platformShare: number;
  commission: number;
}

// an order's due plus its riyadh month ("YYYY-MM" of due_at), for the month filter
export interface OwnerDueRow {
  due: OwnerDue;
  month: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// the riyadh month of an instant (riyadh has no dst)
const riyadhMonth = (at: Date) =>
  new Date(at.getTime() + 3 * 3_600_000).toISOString().slice(0, 7);

/**
 * every due of the consultant, newest first (created_at, then oid): the website dues page's where
 * (getAllDuesOwner: payment PAID, centerId null; a refund moves the payment to REFUND, so refunded
 * orders are out) and its per-order money (calculateDues with payment.commission and the used
 * coupon, a coupon counting only with a discount, as the page does). only what the app shows: no
 * client name / phone, no payment details
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerDues = async (cid: number): Promise<OwnerDueRow[]> => {
  const orders = await prisma.order.findMany({
    where: {
      consultantId: cid,
      payment: { payment: PaymentState.PAID },
      centerId: null,
    },
    orderBy: [{ created_at: "desc" }, { oid: "desc" }],
    select: {
      oid: true,
      type: true,
      programId: true,
      created_at: true,
      due_at: true,
      payment: {
        select: {
          total: true,
          commission: true,
          usedCoupon: { select: { type: true, discount: true } },
        },
      },
      // the website reads meeting[0]; the first session is the stable equivalent
      meeting: {
        orderBy: { session: "asc" },
        take: 1,
        select: { done: true, participants: { select: { attended: true } } },
      },
    },
  });

  return orders.flatMap((order) => {
    const payment = order.payment;
    if (!payment) return [];

    const used = payment.usedCoupon;
    const coupon = used && used.discount ? { type: used.type, discount: used.discount } : null;
    const dues = calculateDues({
      total: payment.total,
      commission: payment.commission,
      coupon: coupon ?? undefined,
    });

    // the website's badge: done, or every participant attended
    const meeting = order.meeting[0];
    const done = !!meeting && (meeting.done || meeting.participants.every((p) => p.attended));

    return [
      {
        due: {
          oid: order.oid,
          type: order.programId ? "PROGRAM" : order.type,
          createdAt: order.created_at.toISOString(),
          dueAt: order.due_at.toISOString(),
          done,
          total: round2(payment.total),
          coupon,
          afterCoupon: dues.totalAfterCoupon,
          share: dues.consultantEarning,
          platformShare: dues.platformEarning,
          commission: payment.commission,
        },
        month: riyadhMonth(order.due_at),
      },
    ];
  });
};

/**
 * the summed share of these dues, like the website table's footer (each order's share is already
 * rounded by calculateDues; the sum is rounded again)
 * @param rows the dues to total
 */
export const sumShare = (rows: OwnerDueRow[]) =>
  round2(rows.reduce((sum, row) => sum + row.due.share, 0));
