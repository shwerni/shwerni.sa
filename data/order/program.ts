"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
moment.locale("en");
import "moment/locale/ar";
import moment from "moment";

// prisma types
import {
  OrderType,
  PaymentState,
  SessionType,
} from "@/lib/generated/prisma/enums";

// utils
import { orderInfoLabel } from "@/utils";
import { dateToString } from "@/utils/moment";
import { cancelSchedule } from "@/utils/schedule/orders";

// schema
import {
  ProgramReservationFormType,
  programReservationSchema,
} from "@/schemas";

// reserve a program order (meeting) with owner
export const reserveProgram = async (
  formdata: ProgramReservationFormType,
  total: number,
) => {
  try {
    // parse
    const parsed = programReservationSchema.safeParse(formdata);

    // validate
    if (!parsed.success) return null;

    // data
    const data = parsed.data;

    // create new reservation
    const order = await prisma.order.create({
      data: {
        author: data.user,
        consultantId: data.cid,
        phone: data.phone,
        name: data.name,
        type: OrderType.SCHEDULED,
        programId: data.prid,
        session: SessionType.MULTIPLE,
        sessionCount: data.sessions,
        meeting: {
          create: {
            session: 1,
            date: dateToString(data.date),
            time: data.time,
            duration: String(data.duration),
          },
        },
        payment: {
          create: {
            total: Number(total),
            commission: 70,
            tax: data.finance.tax,
            payment: PaymentState.PROCESSING,
          },
        },
        info: [
          orderInfoLabel(
            null,
            `new program #${data.prid}`,
            PaymentState.PROCESSING,
            total,
            data.finance.tax,
            70,
            data.consultant,
            data.cid,
          ),
        ],
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

    // cancel order if not paid in 15 min job schedule
    cancelSchedule(order.oid);

    // return
    return order;
  } catch {
    // return
    return null;
  }
};
