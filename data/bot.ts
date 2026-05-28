// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { CouponType, PaymentState } from "@/lib/generated/prisma/enums";
import { getDuesOwnenByMonth } from "./dues";
import { calculateDues } from "../utils/admin/dues";

export async function BotDetectUser(from: string) {
  try {
    return await prisma.user.findUnique({
      where: { phone: from },
      select: { id: true, name: true, role: true, phone: true },
    });
  } catch {
    // return
    return null;
  }
}

export async function BotGetConsultant(userId: string) {
  try {
    return await prisma.consultant.findUnique({
      where: { userId },
      select: { cid: true, name: true, gender: true },
    });
  } catch {
    // return
    return null;
  }
}

export async function BotGetConsultantData(from: string) {
  try {
    // user
    const user = await BotDetectUser(from);

    // validate
    if (!user?.id) return null;

    // data
    return await prisma.consultant.findUnique({
      where: { userId: user.id },
      select: {
        cid: true,
        name: true,
        gender: true,
        approved: true,
        statusA: true,
      },
    });
  } catch {
    // return
    return null;
  }
}

export async function BotConsultantOrder(
  from: string,
  today: string,
  time: string,
) {
  try {
    const data = await prisma.order.findMany({
      where: {
        consultant: { phone: from },
        payment: { payment: PaymentState.PAID },
        meeting: {
          some: {
            OR: [{ date: { gt: today } }, { date: today, time: { gte: time } }],
          },
        },
      },
      select: {
        oid: true,
        name: true,
        phone: true,
        meeting: {
          select: { date: true, time: true },
          orderBy: [{ date: "asc" }, { time: "asc" }],
          take: 1,
        },
      },
    });

    // sorted data
    // return first 3 upcoming
    return data
      .filter((m) => m.meeting[0])
      .sort((a, b) => {
        const dateA = `${a.meeting[0].date} ${a.meeting[0].time}`;
        const dateB = `${b.meeting[0].date} ${b.meeting[0].time}`;
        return dateA.localeCompare(dateB);
      })
      .slice(0, 3);
  } catch {
    // return
    return null;
  }
}

export async function BotClientOrder(
  from: string,
  today: string,
  time: string,
) {
  try {
    return await prisma.order.findFirst({
      where: {
        phone: from,
        payment: { payment: PaymentState.PAID },
        meeting: {
          some: {
            OR: [{ date: { gt: today } }, { date: today, time: { gte: time } }],
          },
        },
      },
      select: {
        oid: true,
        meeting: {
          select: { date: true, time: true },
          orderBy: [{ date: "asc" }, { time: "asc" }],
          take: 1,
        },
        consultant: { select: { name: true } },
      },
      orderBy: { created_at: "asc" },
    });
  } catch {
    // return
    return null;
  }
}

export async function BotConsultantDues(cid: number, date: string) {
  try {
    // dues
    const data = await getDuesOwnenByMonth(date, cid);

    // validate
    if (!data) return null;

    // calcuate
    const total = data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((a: any, c: any) => {
        if (!c.payment) return a;

        const coupon =
          c.payment.usedCoupon && c.payment.usedCoupon.discount
            ? {
                discount: c.payment.usedCoupon.discount,
                type: c.payment.usedCoupon.type as CouponType,
              }
            : undefined;

        const dues = calculateDues({
          total: c.payment.total,
          commission: c.payment.commission,
          coupon,
        });

        return a + dues.consultantEarning;
      }, 0)
      .toFixed(2);

    // return
    return total;
  } catch {
    // return
    return null;
  }
}

// recent messages
export async function getRecentMessages(waid: string, limit = 8) {
  try {
    return await prisma.message.findMany({
      where: { chatId: waid },
      orderBy: { time: "desc" },
      select: { content: true, from: true, time: true },
      take: limit,
    });
  } catch {
    return [];
  }
}
