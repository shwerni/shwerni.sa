"use server";
// prisma data
import { getReservationByOid } from "@/data/order/reserveation";
import { reserveReconciliation } from "@/data/reconciliation";

// types
import { Gender, PaymentState, Relation } from "@/lib/generated/prisma/client";
import { notificationReviewReminder } from "@/lib/notifications";
import { zencryption } from "@/utils/admin/encryption";
import { redirect } from "next/navigation";

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

export const confirmReconciliation = async (
  author: string | undefined,
  name: string,
  phone: string,
  description: string,
  otherName: string,
  otherPhone: string,
  otherGender: Gender,
  otherRelation: Relation,
) => {
  // encrypted order id
  let zid: string;

  // try
  try {
    // get consultant if exist
    const order = await reserveReconciliation(
      author ?? "temp",
      name,
      phone,
      description,
      otherName,
      otherPhone,
      otherGender,
      otherRelation,
    );

    // if success
    if (!order)
      return {
        state: false,
        message: "حدث حطأ ما برجاء المحاولة مرة اخري",
      };

    // encrypted order id
    zid = zencryption(order.oid);
  } catch {
    return {
      state: false,
      message: "حدث حطأ ما برجاء المحاولة مرة اخري",
    };
  }
  // success redirect to payment
  redirect(`/pay/${zid}`);
};