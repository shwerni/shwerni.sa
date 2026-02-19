// React & Next
import { Metadata } from "next";

// components
import Meetings from "@/components/clients/meetings";
import Error404 from "@/components/shared/error-404";

// prisma types
import { PaymentState, SessionType } from "@/lib/generated/prisma/client";

// prisma data
import { getReservationByOid } from "@/data/order/reserveation";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { zdencryption } from "@/utils/admin/encryption";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// props
type Props = {
  params: Promise<{ zid: string }>;
  searchParams: Promise<{
    session?: number;
    participant?: string;
  }>;
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { zid } = await params;

  // session
  const { session, participant } = await searchParams;

  // get zdencrypt oid
  const oid = zdencryption(String(zid));

  // validate
  if (!oid) return <Error404 />;

  // get consultant
  const order = await getReservationByOid(oid);

  // if not exist
  if (!order || order.payment?.payment !== PaymentState.PAID)
    return <Error404 />;

  // check order program
  const isProgram = order.session === SessionType.MULTIPLE;

  // program
  if (isProgram && !session) return <Error404 />;

  // meeting
  const meeting = isProgram
    ? order.meeting[Number(session) - 1]
    : order.meeting[0];

  // validate
  if (!meeting) return <Error404 />;

  // time and date
  const { date, time } = timeZone();

  // if not exist
  if (!date || !time) return <Error404 />;

  // return
  return (
    <Meetings
      zid={zid}
      order={order}
      time={time}
      date={date}
      meeting={meeting}
      session={session ?? 1}
      participant={participant}
    />
  );
}
