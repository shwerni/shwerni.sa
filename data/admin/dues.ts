"use server";
// packages
import moment from "moment";

// prisma db
import prisma from "@/lib/database/db";

// types
import { GroupedDues } from "@/types/types";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";
import { calculateDues } from "@/utils/admin/dues";

// get all dues
export const getAllDuesAdmin = async () => {
  try {
    // get paid order
    const dues = await prisma.order.findMany({
      where: {
        payment: {
          payment: PaymentState.PAID,
        },
      },
      select: {
        oid: true,
        consultantId: true,
        due_at: true,
        meeting: {
          select: {
            done: true,
            url: true,
            consultantAttendance: true,
            clientAttendance: true,
          },
        },
        payment: {
          include: {
            usedCoupon: true,
          },
        },
        consultant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
    // return
    return dues;
  } catch {
    // return
    return null;
  }
};

// get all dues for one owner
export const getAllDuesAdminByCid = async (cid: number) => {
  try {
    // get paid order
    const dues = await prisma.order.findMany({
      where: {
        consultantId: cid,
        payment: {
          payment: PaymentState.PAID,
        },
      },
      select: {
        oid: true,
        name: true,
        due_at: true,
        meeting: {
          select: {
            url: true,
            done: true,
            consultantAttendance: true,
            clientAttendance: true,
          },
        },
        payment: {
          include: {
            usedCoupon: true,
          },
        },
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
    // return
    return dues;
  } catch {
    // return
    return null;
  }
};

// get range dues
export const getDuesAdminByMonth = async (range: string) => {
  try {
    // parse month year to get month and year
    const pDate = moment(range, "MM-YYYY");

    // use moment to handle dates
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    // get all orders created in the specified month and year
    const dues = await prisma.order.findMany({
      where: {
        payment: {
          payment: PaymentState.PAID,
        },
        due_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        oid: true,
        consultantId: true,
        due_at: true,
        meeting: {
          select: {
            done: true,
            url: true,
            consultantAttendance: true,
            clientAttendance: true,
          },
        },
        payment: {
          select: {
            total: true,
            tax: true,
            commission: true,
          },
        },
        consultant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // return
    return dues;
  } catch  {
    return null;
  }
};

// get range dues
export const getDuesAdminByMonthByCid = async (range: string, cid: number) => {
  try {
    // parse month year to get month and year
    const pDate = moment(range, "MM-YYYY");

    // use moment to handle dates
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    // get all orders created in the specified month and year
    const dues = await prisma.order.findMany({
      where: {
        consultantId: cid,
        payment: {
          payment: PaymentState.PAID,
        },
        due_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        oid: true,
        name: true,
        due_at: true,
        meeting: {
          select: {
            done: true,
            url: true,
            consultantAttendance: true,
            clientAttendance: true,
          },
        },
        payment: {
          select: {
            total: true,
            tax: true,
            commission: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // return
    return dues;
  } catch  {
    return null;
  }
};

// get range dues
export const getTotalDuesAdminByMonth = async (range: string) => {
  try {
    const pDate = moment(range, "MM-YYYY");
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    const dues = await prisma.order.findMany({
      where: {
        payment: {
          payment: PaymentState.PAID,
        },
        due_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        consultantId: true,
        consultant: true,
        payment: {
          include: {
            usedCoupon: true,
          },
        },
      },
    });

    // results
    const groupedOrders = dues.reduce(
      (acc: { [key: number]: GroupedDues }, order) => {
        const payment = order.payment!;

        const duesCalc = calculateDues({
          total: payment.total,
          commission: payment.commission,
          coupon: payment.usedCoupon
            ? {
                discount: payment.usedCoupon.discount,
                type: payment.usedCoupon.type,
              }
            : undefined,
        });

        if (!acc[order.consultantId]) {
          acc[order.consultantId] = {
            cid: order.consultantId,
            consultant: order.consultant.name,
            total: 0,
            count: 0,
            finalTotal: 0,
          };
        }

        acc[order.consultantId].total += payment.total;
        acc[order.consultantId].count += 1;
        acc[order.consultantId].finalTotal += duesCalc.consultantEarning; // 👈 key: consultant’s actual earning

        return acc;
      },
      {}
    );

    const groupedArray = Object.entries(groupedOrders).map(([cid, data]) => ({
      cid: Number(cid),
      consultant: data.consultant,
      total: data.total,
      count: data.count,
      finalTotal: data.finalTotal,
    }));

    const cids = groupedArray.map((g) => g.cid);

    const consultants = await prisma.consultant.findMany({
      where: { cid: { in: cids } },
      select: { cid: true, iban: true, bankName: true },
    });

    const consultantMap: { [key: number]: Partial<GroupedDues> } = {};
    consultants.forEach((co) => {
      consultantMap[co.cid] = {
        cid: co.cid,
        iban: co.iban ?? "",
        bankName: co.bankName ?? "",
      };
    });

    const result: GroupedDues[] = groupedArray.map((g) => ({
      ...g,
      iban: consultantMap[g.cid]?.iban,
      bankName: consultantMap[g.cid]?.bankName,
    }));

    return result;
  } catch {
    return null;
  }
};

// get range dues
export const getCompletedTotalDuesAdminByMonth = async (range: string) => {
  try {
    // parse month year to get month and year
    const pDate = moment(range, "MM-YYYY");

    // use moment to handle dates
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    // get total orders for one owners
    const dues = await prisma.order.findMany({
      where: {
        payment: { payment: PaymentState.PAID },
        meeting: {
          some: {
            url: { not: null },
            consultantAttendance: true,
            clientAttendance: true,
          },
        },
        due_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        consultantId: true,
        consultant: true,
        payment: {
          select: {
            total: true,
            tax: true,
            commission: true,
          },
        },
      },
    });

    interface GroupedOrder {
      cid: number;
      consultant: string;
      total: number;
      tax: number;
      count: number;
      finalTotal: number;
    }

    // results
    const groupedOrders = dues.reduce(
      (acc: { [key: number]: GroupedOrder }, order) => {
        const payment = order.payment!;

        const finalTotal = payment.total * (payment.commission / 100);
        if (!acc[order.consultantId]) {
          acc[order.consultantId] = {
            cid: order.consultantId,
            consultant: order.consultant.name,
            total: 0,
            tax: 0,
            count: 0,
            finalTotal: 0,
          };
        }
        acc[order.consultantId].total += payment.total;
        acc[order.consultantId].tax += payment.tax;
        acc[order.consultantId].count += 1;
        acc[order.consultantId].finalTotal += finalTotal;
        return acc;
      },
      {}
    );

    // Convert grouped orders to an array
    const result = Object.values(groupedOrders);

    // return
    return result;
  } catch (error) {
    return null;
  }
};

export const totalDuesByPaymentMethods = async (range: string) => {
  try {
    // parse month year to get month and year
    const pDate = moment(range, "MM-YYYY");

    // use moment to handle dates
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    // orders
    const orders = await prisma.payment.groupBy({
      by: ["method"],
      where: {
        order: {
          due_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        payment: PaymentState.PAID,
      },
      _sum: {
        total: true,
      },
      _count: {
        payment: true,
      },
    });
    // return
    return orders;
  } catch {
    // return
    return null;
  }
};
