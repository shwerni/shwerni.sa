"use server";
// React & Next
import React from "react";

// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import EditMeeting from "@/app/_components/management/layout/meetings/editMeeting";

// prisma data
import { getReservationByOid } from "@/data/order/reserveation";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// props
type Props = {
  params: Promise<{ oid: string }>;
  searchParams: Promise<{
    session?: string;
  }>;
};


export default async function Page({
  params, searchParams
}: Props) {
  // oid
  const { oid } = await params;

  // url params
  const { session } = await searchParams;

  // get orders
  const order = await getReservationByOid(Number(oid));

  // meeting
  const meeting = order?.meeting[session ? (Number(session) - 1) : 1];

  // if not exist
  if (!order || !meeting) return <WrongPage />;

  // return
  return <EditMeeting meetings={order.meeting} client={order.name} consultant={order.consultant.name} type={order.type} lang="ar" role={UserRole.SERVICE} meeting={meeting} />;
}
