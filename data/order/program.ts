import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { logBookedMeeting } from "@/data/meeting-log";
import { lockConsultantBookings } from "@/data/booking/lock";
import { checkMeetingTimeConflict } from "@/data/order/reserveation";

// prisma types
import {
  OrderType,
  PaymentState,
  SessionType,
} from "@/lib/generated/prisma/enums";

// utils
import { orderInfoLabel, orderPriceLabel } from "@/utils";
import { isMeetingDuration } from "@/utils/pricing";
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
  originalTotal?: number, // server-resolved price before the coupon (pre-tax) → Payment.originalTotal
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

    // never a meeting with an empty, zero or fractional length
    if (!isMeetingDuration(String(data.duration)))
      return {
        state: false,
        code: "info",
        message: "بيانات النموذج غير صالحة، برجاء مراجعتها والمحاولة مرة أخرى",
      } satisfies ReserveResult<never>;

    // commission for programs is a fixed platform rate — already server-side,
    // left as a literal rather than threaded through Pay since it never
    // varies by consultant the way session commission does
    const PROGRAM_COMMISSION = 70;

    // under the consultant's booking lock, the first meeting's slot is checked (the same check as
    // reserveConsultant) and the order created in one transaction, so two bookings of one slot
    // can't both pass the check
    const order = await prisma.$transaction(async (tx) => {
      await lockConsultantBookings(tx, data.cid);
      const taken = await checkMeetingTimeConflict(
        data.cid,
        data.time,
        dateToString(data.date),
        { author: data.user, phone: data.phone },
        tx,
      );
      if (taken) return null;

      return tx.order.create({
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
              originalTotal,
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
            ...(originalTotal !== undefined
              ? [orderPriceLabel(`new program #${data.prid}`, originalTotal, Number(total))]
              : []),
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
    });

    // the slot was taken (the same answer as reserveConsultant's)
    if (!order)
      return {
        state: false,
        code: "conflict",
        message: `هذا الموعد (${dateToString(data.date)} - ${data.time}) تم حجزه بالفعل، برجاء اختيار وقت آخر`,
      } satisfies ReserveResult<never>;

    // meeting log: the booking's first meeting (customer). it never throws
    await logBookedMeeting(order);

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
