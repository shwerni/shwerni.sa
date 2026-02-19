"use server";
// packages
import moment from "moment";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// get all dues
export const getAllDuesOwner = async (cid: number) => {
  try {
    // get paid order
    const dues = await prisma.order.findMany({
      where: {
        consultantId: cid,
        payment: { payment: PaymentState.PAID },
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        meeting: true,
        payment: {
          include: {
            usedCoupon: true,
          },
        },
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
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
export const getDuesOwnenByMonth = async (range: string, cid: number) => {
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
        payment: { payment: PaymentState.PAID },
        due_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        payment: {
          include: {
            usedCoupon: true,
          },
        },
        meeting: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // return
    return dues;
  } catch (error) {
    return null;
  }
};
