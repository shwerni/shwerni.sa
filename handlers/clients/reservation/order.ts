"use server";
// prisma data
import { getOwnersInfoCid } from "@/data/consultant";
import {
  cancelOrderByOid,
  getReservationByOid,
  getReservationPaymentByOid,
} from "@/data/order/reserveation";

// types
import { PaymentState } from "@/lib/generated/prisma/client";

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
export const reviewReminder = async (oid: number) => {
  try {
    // get order
    const order = await getReservationByOid(oid);

    // if not exist
    if (!order || order.payment?.payment !== PaymentState.PAID) return;

    // get owner
    const owner = await getOwnersInfoCid(order.consultantId);

    // if owner not exist
    if (!owner) return;
    // cancel order & send reminder
    // await sendReviewReminder(
    //   order.oid,
    //   order.name,
    //   order.phone,
    //   String(order.cid),
    //   owner.name ?? "",
    //   owner.gender
    // );
  } catch {
    // return
    return undefined;
  }
};
