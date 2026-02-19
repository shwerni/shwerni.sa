"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
moment.locale("en");
import "moment/locale/ar";
import moment from "moment";

// prisma data
import { addWalletCredit, payPartiallyByWallet } from "@/data/wallet";

// hooks
import {
  onPaymentHold,
  onPaymentRefund,
  onPaymentSuccess,
} from "@/handlers/admin/order/payment";

// utils
import { orderInfoLabel } from "@/utils";
import { dateToString } from "@/utils/date";
import { cancelSchedule } from "@/utils/schedule/orders";
import { aboveAndLowerTime, dateTimeToString } from "@/utils/moment";

import { OrderType, PaymentState } from "@/lib/generated/prisma/enums";

import { ReservationFormType, reservationSchema } from "@/schemas";

// reserve a new order (meeting) with owner
export const reserveConsultant = async (
  formdata: ReservationFormType,
  total: number,
  collaboration?: string,
) => {
  try {
    // parse
    const parsed = reservationSchema.safeParse(formdata);

    // validate
    if (!parsed.success) return null;

    // data
    const data = parsed.data;

    // check time conflict
    const conflict = await checkMeetingTimeConflict(
      data.cid,
      data.time,
      dateToString(data.date),
    );

    // validate
    if (conflict) return null;

    // get owner data
    const owner = await prisma.consultant.findFirst({
      where: { cid: data.cid },
      select: { name: true, commission: true },
    });

    // if owner not exist
    if (!owner || !owner.name) return null;

    // onwer name & commission
    const { name, commission } = owner;

    // order commission if owner dont have specific commission set the default
    const oCommission = commission ? commission : data?.finance.commission;

    // client name
    const clinetName =
      data.hasBeneficiary && data.beneficiaryName
        ? data.beneficiaryName
        : data.name;

    // client phone
    const clientPhone =
      data.hasBeneficiary && data.beneficiaryPhone
        ? data.beneficiaryPhone
        : data.phone;

    // collaboration info
    const collaborator = await prisma.collaboration.findUnique({
      where: { id: collaboration ?? "" },
    });

    // create new reservation
    const order = await prisma.order.create({
      data: {
        author: data.user,
        consultantId: data.cid,
        name: clinetName,
        phone: clientPhone,
        description: data.notes,
        type: data.type,
        meeting: {
          create: {
            session: 1,
            date: dateToString(data.date),
            time: data.time,
            duration: data.duration,
          },
        },
        payment: {
          create: {
            total,
            commission: oCommission,
            tax: data.finance.tax,
            payment: PaymentState.NEW,
          },
        },
        info: [
          orderInfoLabel(
            null,
            "new",
            PaymentState.NEW,
            total,
            data.finance.tax,
            oCommission,
            name,
            data.cid,
          ),
        ],
        ...(data.hasBeneficiary
          ? {
              guest: {
                create: {
                  name: data.name,
                  phone: data.phone,
                },
              },
              gift: true,
            }
          : {}),
        ...(collaborator && collaborator.status
          ? { collaboratorId: collaborator.id }
          : {}),
      },
      include: {
        payment: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // if instant
    if (data.type === OrderType.INSTANT) {
      await prisma.instant.update({
        where: { consultantId: data.cid },
        data: { status: false, statusA: false },
      });
    }

    // cancel order if not paid in 15 min job schedule
    cancelSchedule(order.oid);

    // return
    return order;
  } catch {
    // return
    return null;
  }
};

// get reservation
export const checkMeetingTimeConflict = async (
  cid: number,
  time: string,
  date: string,
) => {
  try {
    // half hour before and after ofset check
    const timeOffset: string[] = aboveAndLowerTime(time);

    // check if order conflict
    const conflict = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM orders o
        JOIN meetings m ON o.oid = m."orderId"
        JOIN payments p ON p."orderId" = o.oid
        WHERE o."consultantId" = ${cid}
          AND m.date = ${date}
          AND m.time = ANY(${timeOffset}::text[])
          AND p.payment = 'PAID'
      ) as exists
    `;

    // check if freesession
    const free = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
    SELECT 1
    FROM "free_sessions"
    WHERE "consultantId" = ${cid}
      AND date = ${date}
      AND time = ANY(${timeOffset}::text[])
      ) as exists
    `;

    // no conflict
    return conflict[0].exists || free[0].exists;
  } catch {
    return false;
  }
};

// get reservation
export const getReservationById = async (id: string) => {
  try {
    // get order
    const order = await prisma.order.findFirst({ where: { id: id } });

    // if not exist
    if (!order) return null;

    // if exist
    return order;
  } catch {
    return null;
  }
};

// get reservation
export const getReservationByOid = async (oid: number) => {
  try {
    // get order
    const order = await prisma.order.findFirst({
      where: { oid },
      include: {
        meeting: true,
        program: true,
        payment: {
          include: {
            usedCoupon: true,
          },
        },
        guest: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // if not exist
    if (!order) return null;

    // if exist
    return order;
  } catch {
    return null;
  }
};

// get reservation
export const getReservationByPid = async (pid: string) => {
  try {
    // get order
    const order = await prisma.order.findFirst({
      where: { payment: { pid } },
      include: {
        payment: true,
        meeting: true,
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    });

    // if not exist
    if (!order) return null;

    // if exist
    return order;
  } catch {
    return null;
  }
};

// get reservation
export const getReservationPidByOid = async (oid: number) => {
  try {
    // get order
    const order = await prisma.order.findFirst({
      where: { oid },
      select: { payment: { select: { pid: true } } },
    });

    // if not exist
    if (!order) return null;

    // if exist
    return order.payment?.pid;
  } catch {
    return null;
  }
};

// get all orders
export const getAllOrders = async () => {
  try {
    // get all orders
    const orders = await prisma.order.findMany();

    // if not exist
    if (!orders) return null;

    // return orders
    return orders;
  } catch {
    return null;
  }
};

// get all orders
export const getAllOrdersDesc = async () => {
  try {
    // get all orders
    const orders = await prisma.order.findMany({
      orderBy: {
        created_at: "desc",
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

// get all orders
export const getAllOrdersByAuthor = async (author: string) => {
  try {
    // get all orders
    const orders = await prisma.order.findMany({
      where: { author },
      orderBy: {
        created_at: "desc",
      },
      include: {
        meeting: true,
        payment: true,
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

// get all orders
export const getAllOwnersOrdersByAuthor = async (author: string) => {
  try {
    // get all orders
    const owner = await prisma.consultant.findFirst({
      where: { userId: author },
      select: { cid: true },
    });

    // if not exist
    if (!owner || !owner.cid) return null;

    // get all orders
    const orders = await prisma.order.findMany({
      where: { consultantId: owner?.cid },
      orderBy: {
        created_at: "desc",
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

// get all orders
export const getAllPaidOwnersOrdersByAuthor = async (author: string) => {
  try {
    // get all orders
    const owner = await prisma.consultant.findFirst({
      where: { userId: author },
      select: { cid: true },
    });

    // if not exist
    if (!owner || !owner.cid) return null;

    // get all orders
    const orders = await prisma.order.findMany({
      where: {
        consultantId: owner?.cid,
        payment: { payment: PaymentState.PAID },
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        payment: true,
        meeting: true,
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

// get all orders for user (user order page)
export const getAllOrdersByAuthorAndMonth = async (
  author: string,
  range: string,
) => {
  try {
    // parse month year to get month and year
    const pDate = moment(range, "MM-YYYY");

    // use moment to handle dates
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    // Get all orders created in the specified month and year
    const orders = await prisma.order.findMany({
      where: {
        author,
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        meeting: true,
        payment: true,
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    });

    // Return orders
    return orders;
  } catch {
    return null;
  }
};

// get all orders for owners (owner order page)
export const getAllOwnersOrdersByAuthorAndMonth = async (
  author: string,
  range: string,
) => {
  try {
    // get all orders
    const owner = await prisma.consultant.findFirst({
      where: { userId: author },
      select: { cid: true },
    });

    // if not exist
    if (!owner || !owner.cid) return null;

    // parse month year to get month and year
    const pDate = moment(range, "MM-YYYY");

    // use moment to handle dates
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    // Get all orders created in the specified month and year
    const orders = await prisma.order.findMany({
      where: {
        consultantId: owner?.cid,
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Return orders
    return orders;
  } catch {
    return null;
  }
};

// get all paid orders for owners (owner order page)
export const getPaidOwnersOrdersByAuthorAndMonth = async (
  author: string,
  range: string,
) => {
  try {
    // get all orders
    const owner = await prisma.consultant.findFirst({
      where: { userId: author },
      select: { cid: true },
    });

    // if not exist
    if (!owner || !owner.cid) return null;

    // parse month year to get month and year
    const pDate = moment(range, "MM-YYYY");

    // use moment to handle dates
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    // get paid orders created in the specified month and year
    const orders = await prisma.order.findMany({
      where: {
        consultantId: owner?.cid,
        payment: { payment: PaymentState.PAID },
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        payment: true,
        meeting: true,
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    });

    // Return orders
    return orders;
  } catch {
    return null;
  }
};

// get all paid orders for owners (owner order page)
export const getPaidOwnersOrdersByAuthorAndRange = async (
  author: string,
  start: string,
  end: string,
) => {
  try {
    // get all orders
    const owner = await prisma.consultant.findFirst({
      where: { userId: author },
      select: { cid: true },
    });

    // if not exist
    if (!owner || !owner.cid) return null;

    // use moment to handle dates
    const startDate = moment(start, "YYYY-MM-DD").startOf("day").toDate();
    const endDate = moment(end, "YYYY-MM-DD").endOf("day").toDate();

    // get paid orders created in the specified month and year
    const orders = await prisma.order.findMany({
      where: {
        consultantId: owner?.cid,
        payment: { payment: PaymentState.PAID },
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Return orders
    return orders;
  } catch {
    return null;
  }
};

// get all paid orders for owners (owner order page)
export const getPaidOwnersOrdersByCidAndRange = async (
  cid: number,
  start: string,
  end: string,
) => {
  try {
    // use moment to handle dates
    const startDate = moment(start, "YYYY-MM-DD").startOf("day").toDate();
    const endDate = moment(end, "YYYY-MM-DD").endOf("day").toDate();

    // get paid orders created in the specified month and year
    const orders = await prisma.order.findMany({
      where: {
        consultantId: cid,
        payment: { payment: PaymentState.PAID },
        created_at: {
          gte: startDate,
          lt: endDate,
        },
      },
    });
    // Return orders
    return orders;
  } catch {
    return null;
  }
};

// get reservation payment status
export const getReservationPaymentByPid = async (pid: string) => {
  try {
    // get order
    const order = await prisma.order.findFirst({
      where: { payment: { pid } },
      select: { payment: true },
    });

    // if not exist
    if (!order) return null;

    // if exist
    return order;
  } catch {
    return null;
  }
};

// get reservation payment status
export const getReservationPaymentByOid = async (oid: number) => {
  try {
    // get order
    const order = await prisma.order.findFirst({
      where: { oid },
      select: { payment: { select: { payment: true } } },
    });

    // if not exist
    if (!order || !order.payment) return null;

    // if exist
    return order.payment;
  } catch {
    return null;
  }
};

// update payment status
export const updateOrderStatus = async (pid: string, status: PaymentState) => {
  try {
    // current order payment state
    const order = await prisma.payment.findUnique({
      where: { pid },
      select: { payment: true },
    });

    // if the order doesn't exist
    if (!order) return null;

    // if the status is already the same
    if (order.payment === status) return true;

    // if paid
    if (status == PaymentState.PAID) {
      // update order
      const success = await orderStatusPaid(pid);
      // return success
      return success;
    }

    // if refund
    if (status == PaymentState.REFUND) {
      // update order
      const refund = await orderStatusRefund(pid);
      // return success
      return refund;
    }

    // if hold
    if (status == PaymentState.HOLD) {
      // update order
      await orderStatusHold(pid);
    }

    // update order
    const other = await prisma.payment.update({
      where: { pid },
      data: {
        payment: status,
        order: {
          update: {
            info: {
              push: [
                `order's payment status changed to ${status} | modified_at: ${dateTimeToString(
                  new Date(),
                )}`,
              ],
            },
          },
        },
      },
      select: { payment: true },
    });
    // if not return null
    return other;
  } catch {
    return null;
  }
};

// order status to paid (separate function to add any adds on)
export const orderStatusPaid = async (pid: string) => {
  try {
    //  order
    const orderId = await prisma.payment.findUnique({
      where: { pid },
      select: { orderId: true },
    });

    // validate
    if (!orderId || !orderId.orderId) return;

    // get order
    const order = await prisma.order.findUnique({
      where: { oid: orderId.orderId },
      include: {
        payment: true,
        meeting: true,
        program: true,
        guest: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // validate
    if (!order) return false;

    // order
    const payment = order.payment;

    // payment utils (not already paid)
    if (payment && payment.payment !== PaymentState.PAID) {
      // notify client & owner
      await onPaymentSuccess(order);

      // update wallet if it used
      if (payment.wallet && payment.wallet > 0) {
        // wallet partial payment
        const wallet = await payPartiallyByWallet(
          order.author,
          order.oid,
          payment.total,
          payment.tax,
          payment.wallet,
        );
        // if withdraw form wallet have an issue
        if (!wallet) {
          await prisma.payment.update({
            where: { pid },
            data: {
              payment: PaymentState.HOLD,
              order: {
                update: {
                  info: {
                    push: [
                      `order's payment status changed to ${
                        PaymentState.HOLD
                      } due to wallet withdraw issue | modified_at: ${dateTimeToString()}`,
                    ],
                  },
                },
              },
            },
          });
          // return
          return null;
        }
      }
      // update order
      await prisma.payment.update({
        where: { pid },
        data: {
          payment: PaymentState.PAID,
          order: {
            update: {
              info: {
                push: [
                  `order's payment status changed to ${
                    PaymentState.PAID
                  } | modified_at: ${dateTimeToString(new Date())}`,
                ],
              },
            },
          },
        },
      });
    }
    // return order
    return true;
  } catch {
    return null;
  }
};

// order status to paid (separate function to add any adds on)
export const orderStatusHold = async (pid: string) => {
  try {
    //  order
    const payment = await prisma.payment.findUnique({
      where: { pid },
      include: { order: true },
    });

    // if not exist
    if (!payment || !payment.order) return null;

    // notify client & owner
    await onPaymentHold(payment.order);
    // return order
    return true;
  } catch {
    return null;
  }
};

// order status to paid (separate function to add any adds on)
export const orderStatusRefund = async (pid: string) => {
  try {
    //  order
    const orderId = await prisma.payment.findUnique({
      where: { pid },
      select: { orderId: true },
    });

    // validate
    if (!orderId || !orderId.orderId) return;

    const order = await prisma.order.findUnique({
      where: { oid: orderId.orderId },
      include: {
        payment: true,
        meeting: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // validate
    if (!order) return false;

    // order
    const payment = order.payment;

    // payment utils
    if (payment && payment.payment === PaymentState.PAID) {
      // notify client & owner
      await onPaymentRefund(order, payment.wallet ?? 0);

      // update order
      await prisma.payment.update({
        where: { pid },
        data: {
          payment: PaymentState.REFUND,
          wallet: null,
          order: {
            update: {
              info: {
                push: [
                  `order's payment status changed to ${
                    PaymentState.REFUND
                  } | modified_at: ${dateTimeToString(new Date())}`,
                ],
              },
            },
          },
        },
      });

      // wallet credit
      addWalletCredit(order.author, order.oid, payment.total, payment.tax);
    }

    // return order
    return true;
  } catch {
    return null;
  }
};

// get all repeated times for a data and owner
export const alreadyReservedTimes = async (cid: number, date: string) => {
  try {
    // get already reserved times
    const orders = await prisma.order.findMany({
      where: {
        consultantId: cid,
        payment: {
          payment: {
            in: [PaymentState.NEW, PaymentState.PROCESSING, PaymentState.PAID],
          },
        },
        meeting: {
          some: {
            date,
          },
        },
      },
      select: { meeting: { select: { time: true } } },
    });

    // array of times
    const timesSet = new Set<string>();

    for (const order of orders) {
      for (const m of order.meeting) {
        if (m.time) timesSet.add(m.time);
      }
    }

    return Array.from(timesSet);
  } catch {
    return null;
  }
};

// update order actual paid value
export const updateOrderPaidByOid = async (oid: number, total: number) => {
  try {
    await prisma.order.update({
      where: {
        oid,
      },
      data: {
        payment: { update: { paid: total, payment: PaymentState.PROCESSING } },
      },
      select: { payment: { select: { paid: true } } },
    });
    return true;
  } catch {
    return null;
  }
};

// cancel order
export const cancelOrderByOid = async (oid: number) => {
  try {
    await prisma.order.update({
      where: {
        oid,
      },
      data: { payment: { update: { payment: PaymentState.CANCELED } } },
      select: { payment: true },
    });
    return true;
  } catch {
    return null;
  }
};

// consultation answer
export const UpdateConsultationAnswer = async (oid: number, answer: string) => {
  try {
    // answer initial state
    const iAnswer = await prisma.order.findUnique({
      where: { oid },
      select: {
        oid: true,
        phone: true,
        name: true,
        consultant: true,
        answer: true,
      },
    });
    // update order's answer
    await prisma.order.update({
      where: {
        oid,
      },
      data: { answer },
      select: {
        oid: true,
      },
    });
    // if answer doesn't exist already
    // if (iAnswer && !iAnswer?.answer) {
    //   // send whatsapp notification
    //   orderBriefNotification(
    //     oid,
    //     iAnswer.phone,
    //     iAnswer.name,
    //     iAnswer.consultant
    //   );
    // }
    // return
    return true;
  } catch {
    return null;
  }
};
