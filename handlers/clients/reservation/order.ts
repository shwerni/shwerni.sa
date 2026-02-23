"use server";
// prisma data
import {
  cancelOrderByOid,
  getReservationByOid,
  getReservationPaymentByOid,
} from "@/data/order/reserveation";

// types
import { PaymentState } from "@/lib/generated/prisma/client";
import { notificationReviewReminder } from "@/lib/notifications";

// days tabs owner
export const cancelOrder = async (oid: number) => {
  try {
    // get order state
    const state = await getReservationPaymentByOid(oid);

    // if state is not processing or new
    if (
      state?.payment !== PaymentState.PROCESSING &&
      state?.payment !== PaymentState.NEW
    )
      return;

    // cancel order & send reminder
    await cancelOrderByOid(oid);

    // await Promise.all([
    // unPaidReminder(
    //   order.oid,
    //   order.name,
    //   order.phone,
    //   String(order.cid),
    //   String(owner.name)
    // ),
    // ]);
    // return
    return true;
  } catch {
    // return
    return undefined;
  }
};

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
