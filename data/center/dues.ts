import "server-only";
// prisma db
import { prismaAll } from "@/lib/database/db";

// prisma types
import { FinanceCategory, PaymentState } from "@/lib/generated/prisma/enums";

// utils
import { computeOrderSplit, shareAfterRefunds } from "@/utils/order-split";

const round2 = (n: number) => Math.round(n * 100) / 100;

// a center's dues (centers spec §7.3)
// earned = Σ centerShare of its paid orders, less proportional refunds (computed here, never written)
// paid = Σ CENTER_PAYOUT finance entries. eligibility mirrors consultant dues: payment PAID,
// so a full refund (state REFUND) drops the order. centerId must come from requireCenter()
export const getCenterDues = async (centerId: number) => {
  // prisma drops undefined filters, which would read every center's orders
  if (!Number.isFinite(centerId)) throw new Error("getCenterDues: invalid centerId");

  try {
    const [orders, payouts] = await Promise.all([
      prismaAll.order.findMany({
        where: { centerId, payment: { payment: PaymentState.PAID } },
        orderBy: { created_at: "desc" },
        select: {
          oid: true,
          consultantId: true,
          due_at: true,
          consultant: { select: { name: true } },
          payment: {
            select: {
              total: true,
              tax: true,
              commission: true,
              centerShare: true,
            },
          },
          refunds: { select: { amount: true } },
        },
      }),
      prismaAll.financeEntry.aggregate({
        where: { centerId, category: FinanceCategory.CENTER_PAYOUT },
        _sum: { amount: true },
      }),
    ]);

    // one row per order: its share, refunds and what is left
    const rows = orders.flatMap((o) => {
      if (!o.payment) return [];
      const { total, tax, commission, centerShare } = o.payment;

      // the snapshot written at PAID; an order without one falls back to its own commission
      // snapshot (the center's % at booking), never the center's current rate
      const share =
        centerShare ??
        computeOrderSplit({
          paidBeforeVat: total,
          platformRate: 100 - commission,
        }).centerShare;

      const refunded = round2(o.refunds.reduce((a, r) => a + r.amount, 0));
      const net = shareAfterRefunds({
        share,
        paidBeforeVat: total,
        refunded,
        taxPercent: tax,
      });

      return [
        {
          oid: o.oid,
          consultantId: o.consultantId,
          consultant: o.consultant.name,
          due_at: o.due_at,
          total,
          share,
          refunded,
          net,
        },
      ];
    });

    // grouping by consultant: reporting only, so the center can settle with its consultants
    const groups = new Map<
      number,
      { consultantId: number; consultant: string; orders: number; earned: number }
    >();
    for (const r of rows) {
      const g = groups.get(r.consultantId) ?? {
        consultantId: r.consultantId,
        consultant: r.consultant,
        orders: 0,
        earned: 0,
      };
      g.orders += 1;
      g.earned = round2(g.earned + r.net);
      groups.set(r.consultantId, g);
    }

    const earned = round2(rows.reduce((a, r) => a + r.net, 0));
    const paid = round2(payouts._sum.amount ?? 0);

    return {
      earned,
      paid,
      balance: round2(earned - paid),
      orders: rows,
      byConsultant: [...groups.values()],
    };
  } catch {
    return null;
  }
};
