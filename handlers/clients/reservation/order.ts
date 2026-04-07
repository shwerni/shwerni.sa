"use server";
// prisma data
import { getReservationByOid } from "@/data/order/reserveation";

// types
import { PaymentState } from "@/lib/generated/prisma/client";
import { notificationReviewReminder } from "@/lib/notifications";

// days tabs owner
export const reviewReminder = async (oid: number, session?: number) => {
  try {
    // get order
    const order = await getReservationByOid(oid);

    // if not exist
    if (!order || order.payment?.payment !== PaymentState.PAID) return;

    // meeting
    const meeting =
      (session ? order.meeting[session] : order.meeting[0]) ?? order.meeting[0];
    // send reminder
    await notificationReviewReminder(
      order.oid,
      order.phone,
      // order.name,
      order.consultant.name,
      meeting.date,
      meeting.time,
    );
  } catch {
    // return
    return undefined;
  }
};
