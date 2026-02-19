"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
import moment from "moment";
import "moment/locale/ar";
moment.locale("en");

// utils
import { dateToString } from "@/utils/moment";

// prisma types
import { PaymentMethod } from "@/lib/generated/prisma/client";

// update payment pid
export const updateMoyasarPid = async (oid: number, pid: string) => {
  try {
    // get order
    const order = await prisma.order.update({
      where: { oid },
      data: {
        payment: {
          update: {
            pid,
            method: PaymentMethod.visaMoyasar,
          },
        },
        info: {
          push: [
            `paymentMethod: ${
              PaymentMethod.visaMoyasar
            } | paymentId: ${pid} |  modified_at: ${dateToString(new Date())}`,
          ],
        },
      },
    });

    // if not exist
    if (!order) return null;

    // if exist
    return true;
  } catch {
    return null;
  }
};

// update tabby pid
export const updateTabbyPid = async (oid: number, pid: string) => {
  try {
    // current order's pid
    const isPid = await prisma.order.findUnique({
      where: { oid },
      select: {
        payment: {
          select: {
            pid: true,
          },
        },
      },
    });

    // if pid exist
    if (isPid?.payment?.pid !== null) return true;

    // get order
    const order = await prisma.order.update({
      where: { oid },
      data: {
        payment: {
          update: {
            pid,
            method: PaymentMethod.tabby,
          },
        },
        info: {
          push: [
            `paymentMethod: ${
              PaymentMethod.tabby
            } | paymentId: ${pid} |  modified_at: ${dateToString(new Date())}`,
          ],
        },
      },
    });

    // if not exist
    if (!order) return null;

    // if exist
    return true;
  } catch {
    return null;
  }
};

// TODO test
// current order's pid
// const isPid = await prisma.order.findUnique({
//   where: { oid },
//   select: { pid: true },
// });

// if pid exist
// if (isPid?.pid !== null) return true;
