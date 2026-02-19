// React & Next
import React from "react";
import Link from "next/link";

// packages
import moment from "moment";

// compoennt
import { Button } from "@/components/ui/button";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// uitls
import { zencryption } from "@/utils/admin/encryption";

// types
import { DateTime } from "@/types/types";
import { Reservation } from "@/types/admin";

// props
interface Props {
  time: DateTime;
  order: Reservation;
}

// return
export default function PayBtn({ time, order }: Props) {
  // zid
  const zid = zencryption(order.oid);

  // is still can refund
  const isPayAble =
    order.payment &&
    order.meeting &&
    CheckHours(time, {
      date: order.meeting[0].date,
      time: order.meeting[0].time,
    }) &&
    order.payment.payment === PaymentState.PROCESSING &&
    !order.payment.pid;

  // return
  return (
    isPayAble && (
      <Link href={`/pay/${zid}`}>
        <Button className="zgreyBtn gap-2 h-fit py-1 text-xs" type="submit">
          ادفع
        </Button>
      </Link>
    )
  );

  // Check if more than 6 hours ahead
  function CheckHours(now: DateTime, order: DateTime) {
    // compare dates and time
    const meeting = moment(`${order.date} ${order.time}`, "YYYY-MM-DD HH:mm");
    const timeNow = moment(`${now.date} ${now.time}`, "YYYY-MM-DD HH:mm");
    // check 6 hours difference
    const diff = meeting.diff(timeNow, "minutes");

    // refund able (still)
    if (diff >= 5) return true;

    // not refund able (expired)
    return false;
  }
}
