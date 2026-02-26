// React & Next
import { Metadata } from "next";

// components
import Meetings from "@/components/clients/meetings";
import Error404 from "@/components/shared/error-404";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { getMeeting } from "@/data/meetings";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// props
type Props = {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{
    participant?: string;
  }>;
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { mid } = await params;

  // session
  const { participant } = await searchParams;

  // validate
  if (!participant) return <Error404 />;

  // get consultant
  const meeting = await getMeeting(mid);

  // validate
  if (!meeting) return <Error404 />;
  
  // validate
  if (meeting?.orders?.payment?.payment !== PaymentState.PAID)
    return <Error404 />;

  // time and date
  const { date, time } = timeZone();

  // return
  return (
    <Meetings
      mid={mid}
      order={meeting.orders}
      time={time}
      date={date}
      meeting={meeting}
      participant={participant}
    />
  );
}
