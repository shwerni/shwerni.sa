"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
import { z } from "zod";

// schemas
import { OrderSchema } from "@/schemas/admin";

// utils
import { orderInfoLabel } from "@/utils";
import { dateTimeToString } from "@/utils/moment";

// hooks
import {
  onPaymentRefund,
  onPaymentSuccess,
} from "@/handlers/admin/order/payment";

// prsima data
import { addWalletCredit } from "../wallet";

// prisma types
import {  PaymentMethod, PaymentState } from "@/lib/generated/prisma/enums";


// auth types
import { User } from "next-auth";
import { Consultant } from "@/lib/generated/prisma/client";

// get all orders
export const getAllOrdersDescAdmin = async () => {
  try {
    // get all orders
    const orders = await prisma.order.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        oid: true,
        name: true,
        phone: true,
        created_at: true,
        payment: {
          select: {
            payment: true,
            tax: true,
            total: true,
          },
        },
        meeting: {
          select: {
            date: true,
          },
        },
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    });

    // if not exist
    if (!orders) return null;

    // return orders
    return orders;
  } catch {
    return null;
  }
};

// update order
export const updateOrderAdmin = async (
  user: User,
  oid: number,
  data: z.infer<typeof OrderSchema>,
  due: Date,
  owner: Partial<Consultant> | undefined
) => {
  // new data
  const validatedFields = OrderSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatedFields || !owner || !owner.cid || !owner.name) return null;
  try {
    // get all owner
    const order = await prisma.order.update({
      where: { oid },
      data: {
        name: data.name,
        phone: data.phone,
        consultantId: owner.cid,
        due_at: due,
        payment: {
          update: {
            payment: data.status as PaymentState,
            total: data.total,
            tax: data.tax,
            commission: data.commission,
          },
        },
        info: {
          push: [
            orderInfoLabel(
              user,
              oid,
              data.status as PaymentState,
              data.total,
              data.tax,
              data.commission,
              owner.name,
              owner.cid
            ),
          ],
        },
      },
      include: {
        payment: true,
        meeting: true,
        guest: true,
        program: true,
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    });

    // if notify true send notify
    if (data.notify && data.status === PaymentState.PAID) {
      // on paid
      onPaymentSuccess(order);
    }
    // if notify true send notify
    if (data.notify && data.status === PaymentState.REFUND) {
      // on refund
      onPaymentRefund(order, order.payment!.wallet ?? 0);
      // add credit
      addWalletCredit(
        order.author,
        order.oid,
        order.payment!.total,
        order.payment!.tax
      );
    }

    // return
    return order;
  } catch (error) {
    // return
    return null;
  }
};

// create new order
export const createOrderAdmin = async (
  user: User,
  data: z.infer<typeof OrderSchema>,
  date: string,
  time: string,
  owner: Partial<Consultant> | undefined,
  done: boolean
) => {
  // new data
  const validatedFields = OrderSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatedFields || !owner || !owner.cid || !owner.name) return null;

  try {
    // get all owner
    const order = await prisma.order.create({
      data: {
        author: "zadmin",
        name: data.name,
        phone: data.phone,
        consultantId: owner.cid,
        payment: {
          create: {
            method: PaymentMethod.transaction,
            payment: data.status as PaymentState,
            total: data.total,
            tax: data.tax,
            commission: data.commission,
          },
        },
        meeting: {
          create: {
            duration: data.duration,
            date,
            time,
            consultantAttendance: done,
            clientAttendance: done,
            clientJoinedAt: done ? "manual" : "",
            consultantJoinedAt: done ? "manual" : "",
            url: done ? "manual" : "",
            session: 1,
          },
        },
        info: [
          orderInfoLabel(
            user,
            "new",
            data.status as PaymentState,
            data.total,
            data.tax,
            data.commission,
            owner.name,
            owner.cid
          ),
        ],
      },
      include: {
        payment: true,
        meeting: true,
        program: true,
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    });

    // if notify true send notify
    if (data.notify && data.status === PaymentState.PAID) {
      // on paid
      onPaymentSuccess(order);
    }

    // if notify true send notify
    if (data.notify && data.status === PaymentState.REFUND) {
      // on refund
      onPaymentRefund(order, order.payment!.wallet ?? 0);
      // add credit
      addWalletCredit(
        order.author,
        order.oid,
        order.payment!.total,
        order.payment!.tax
      );
    }

    // return
    return order;
  } catch (error) {
    // return
    return null;
  }
};

// delete order
export const deleteOrderAdmin = async (oid: number) => {
  try {
    // delete this review
    const order = await prisma.order.delete({
      where: { oid },
    });
    return Boolean(order);
  } catch {
    return null;
  }
};

// bulk status
export const bulkStatusOrderAdmin = async (
  oids: number[],
  payment: PaymentState
) => {
  try {
    // date & time
    const modifiedAt = dateTimeToString();

    // update status bulk
    await prisma.payment.updateMany({
      where: {
        order: {
          oid: { in: oids },
        },
      },
      data: {
        payment: payment,
      },
    });

    await prisma.order.updateMany({
      where: { oid: { in: oids } },
      data: {
        info: {
          push: [
            `order's payment status changed to ${payment} | modified_at: ${modifiedAt}`,
          ],
        },
      },
    });

    return true;
  } catch {
    return null;
  }
};

export async function getOrdersForManagments(page: number, search: string) {
  const limit = 10;
  const skip = (page - 1) * limit;

  // base where
  let where: any = {};

  // search
  if (search?.trim()) {
    if (search.startsWith("#")) {
      const oid = parseInt(search.slice(1).trim());
      if (!isNaN(oid)) {
        where = { oid };
      }
    } else {
      where = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          {
            consultant: {
              is: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        ],
      };
    }
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        consultant: { select: { name: true, phone: true } },
        payment: { select: { payment: true, total: true } },
        meeting: { select: { session: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}
