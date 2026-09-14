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
  tax: number, // server-resolved — do not read from formdata.finance
) => {
  try {
    const parsed = programReservationSchema.safeParse(formdata);

    if (!parsed.success)
      return {
        state: false,
        code: "info",
        message: "بيانات النموذج غير صالحة، برجاء مراجعتها والمحاولة مرة أخرى",
      } satisfies ReserveResult<never>;

    const data = parsed.data;

    // commission for programs is a fixed platform rate — already server-side,
    // left as a literal rather than threaded through Pay since it never
    // varies by consultant the way session commission does
    const PROGRAM_COMMISSION = 70;

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
            commission: PROGRAM_COMMISSION,
            tax,
            payment: PaymentState.PROCESSING,
          },
        },
        info: [
          orderInfoLabel(
            null,
            `new program #${data.prid}`,
            PaymentState.PROCESSING,
            total,
            tax,
            PROGRAM_COMMISSION,
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
