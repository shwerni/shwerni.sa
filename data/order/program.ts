"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  OrderType,
  PaymentState,
  SessionType,
} from "@/lib/generated/prisma/enums";

// utils
import { orderInfoLabel } from "@/utils";
import { dateToString } from "@/utils/time";

// schema
import {
  ProgramReservationFormType,
  programReservationSchema,
} from "@/schemas";
import { ReserveResult } from "@/types/admin";

// reserve a program order (meeting) with owner
export const reserveProgram = async (
  formdata: ProgramReservationFormType,
  total: number,
) => {
  try {
    // parse
    const parsed = programReservationSchema.safeParse(formdata);

    // validate
    if (!parsed.success)
      return {
        state: false,
        code: "info",
        message: "بيانات النموذج غير صالحة، برجاء مراجعتها والمحاولة مرة أخرى",
      } satisfies ReserveResult<never>;

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
        meeting: {
          include: { participants: true },
        },
        consultant: {
          select: { userId: true, name: true, phone: true },
        },
      },
    });

    // return
    return { state: true, order } satisfies ReserveResult<typeof order>;
  } catch (err) {
    console.error("reserveProgram:", err);
    return {
      state: false,
      code: "error",
      message: "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى",
    } satisfies ReserveResult<never>;
  }
};
