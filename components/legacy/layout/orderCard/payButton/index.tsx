// React & Next
import Link from "next/link";

// packages
import { differenceInMinutes, parse } from "date-fns";

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
    const meeting = parse(
      `${order.date} ${order.time}`,
      "yyyy-MM-dd HH:mm",
      new Date(),
    );
    const timeNow = parse(
      `${now.date} ${now.time}`,
      "yyyy-MM-dd HH:mm",
      new Date(),
    );
    // check 6 hours difference
    const diff = differenceInMinutes(meeting, timeNow);

    // refund able (still)
    if (diff >= 5) return true;

    // not refund able (expired)
    return false;
  }
}
