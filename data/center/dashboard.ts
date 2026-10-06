import "server-only";
// prisma db
import { prismaAll } from "@/lib/database/db";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ApprovalState,
  CenterBankState,
  PaymentState,
} from "@/lib/generated/prisma/enums";

// utils
import { timeZone } from "@/utils/date";

// center dashboard reads and writes (centers spec §11). every function takes the centerId that
// requireCenter() returned; ids from the client (cid, oid) only ever narrow a query that is
// already scoped to that center, so another center's row simply reads as missing

// prisma drops undefined filters, so a bad center id must never reach a query
const assertCenterId = (centerId: number) => {
  if (!Number.isFinite(centerId)) throw new Error("invalid center id");
};

// ─── overview ────────────────────────────────────────────────────────────────

// paid sessions from today on (riyadh date) and the pending approvals count
export const getCenterOverview = async (centerId: number) => {
  assertCenterId(centerId);
  const { date: today } = timeZone();

  const [sessions, pendingConsultants, pendingBank] = await Promise.all([
    prismaAll.meeting.findMany({
      where: {
        date: { gte: today },
        done: false,
        orders: { centerId, payment: { payment: PaymentState.PAID } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 12,
      select: {
        mid: true,
        date: true,
        time: true,
        duration: true,
        orders: {
          select: { oid: true, name: true, consultant: { select: { name: true } } },
        },
      },
    }),
    prismaAll.consultant.count({
      where: { centerId, approved: ApprovalState.PENDING },
    }),
    prismaAll.centerBankAccount.count({
      where: { centerId, state: CenterBankState.PENDING },
    }),
  ]);

  return {
    today,
    sessions,
    pendingApprovals: pendingConsultants + pendingBank,
  };
};

// ─── orders ──────────────────────────────────────────────────────────────────

export const CENTER_ORDERS_PAGE_SIZE = 10;

export type CenterOrdersFilter = {
  page: number;
  // order number or client name
  q: string;
  // consultant cid (0 = all)
  cid: number;
  // session date range, yyyy-MM-dd ("" = open)
  from: string;
  to: string;
  // payment state ("" = all)
  state: PaymentState | "";
};

// the center's orders, newest first, with search and filters
export const getCenterOrders = async (centerId: number, f: CenterOrdersFilter) => {
  assertCenterId(centerId);

  const q = f.q.trim();
  const where: Prisma.OrderWhereInput = {
    centerId,
    ...(f.cid > 0 && { consultantId: f.cid }),
    ...(f.state && { payment: { payment: f.state } }),
    ...((f.from || f.to) && {
      meeting: {
        some: {
          date: { ...(f.from && { gte: f.from }), ...(f.to && { lte: f.to }) },
        },
      },
    }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        ...(/^\d+$/.test(q) ? [{ oid: Number(q) }] : []),
      ],
    }),
  };

  try {
    const [total, orders] = await Promise.all([
      prismaAll.order.count({ where }),
      prismaAll.order.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (Math.max(1, f.page) - 1) * CENTER_ORDERS_PAGE_SIZE,
        take: CENTER_ORDERS_PAGE_SIZE,
        select: {
          oid: true,
          name: true,
          created_at: true,
          consultant: { select: { name: true } },
          payment: { select: { payment: true, total: true, centerShare: true } },
          meeting: {
            orderBy: { session: "asc" },
            take: 1,
            select: { date: true, time: true, duration: true },
          },
        },
      }),
    ]);
    return {
      orders,
      total,
      pages: Math.max(1, Math.ceil(total / CENTER_ORDERS_PAGE_SIZE)),
    };
  } catch {
    return { orders: [], total: 0, pages: 1 };
  }
};

// one order of this center (read-only detail). the client is shown by name only, like the
// consultant dashboard
export const getCenterOrder = async (centerId: number, oid: number) => {
  assertCenterId(centerId);
  if (!Number.isInteger(oid)) return null;

  try {
    return await prismaAll.order.findFirst({
      where: { oid, centerId },
      select: {
        oid: true,
        name: true,
        created_at: true,
        sessionCount: true,
        consultant: { select: { cid: true, name: true } },
        payment: {
          select: {
            payment: true,
            method: true,
            total: true,
            tax: true,
            centerShare: true,
            usedCoupon: { select: { code: true, discount: true } },
          },
        },
        meeting: {
          orderBy: { session: "asc" },
          select: {
            mid: true,
            session: true,
            date: true,
            time: true,
            duration: true,
            done: true,
          },
        },
        refunds: { select: { amount: true, refundedAt: true } },
      },
    });
  } catch {
    return null;
  }
};

// the center's consultants, for the orders filter
export const getCenterConsultantOptions = async (centerId: number) => {
  assertCenterId(centerId);
  try {
    return await prismaAll.consultant.findMany({
      where: { centerId },
      orderBy: { name: "asc" },
      select: { cid: true, name: true },
    });
  } catch {
    return [];
  }
};

// ─── settings ────────────────────────────────────────────────────────────────

// the center's own profile and theme (slug and status are shown, never edited here)
export const getCenterSettings = async (centerId: number) => {
  assertCenterId(centerId);
  try {
    return await prismaAll.center.findUnique({
      where: { ceid: centerId },
      select: {
        ceid: true,
        slug: true,
        status: true,
        name: true,
        description: true,
        logo: true,
        cover: true,
        city: true,
        district: true,
        address: true,
        lat: true,
        lng: true,
        phone: true,
        whatsapp: true,
        email: true,
        preference: true,
        amenities: true,
        policy: true,
        themeKey: true,
        themeVars: true,
      },
    });
  } catch {
    return null;
  }
};

export type CenterSettings = NonNullable<Awaited<ReturnType<typeof getCenterSettings>>>;

// profile fields a center may edit (validated by the action's schema)
export type CenterProfileData = {
  name: string;
  description: string | null;
  logo: string | null;
  cover: string | null;
  city: string;
  district: string | null;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  preference: Prisma.CenterUpdateInput["preference"];
  amenities: string[];
  policy: string | null;
};

export const updateCenterProfile = async (
  centerId: number,
  data: CenterProfileData,
) => {
  assertCenterId(centerId);
  return prismaAll.center.update({
    where: { ceid: centerId },
    data,
    select: { ceid: true, slug: true },
  });
};

export const updateCenterTheme = async (
  centerId: number,
  themeKey: string,
  themeVars: Record<string, string> | null,
) => {
  assertCenterId(centerId);
  return prismaAll.center.update({
    where: { ceid: centerId },
    data: { themeKey, themeVars: themeVars ?? Prisma.DbNull },
    select: { ceid: true, slug: true },
  });
};
