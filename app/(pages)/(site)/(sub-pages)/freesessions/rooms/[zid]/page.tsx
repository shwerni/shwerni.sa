// React & Next
import { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import MeetingRoom from "@/components/clients/meetings/room";
import HMSLayout from "@/components/clients/meetings/room/laytout";

// prisma types
import { Meeting, UserRole } from "@/lib/generated/prisma/client";

// prisma data
import { getOwnersInfoByAuthor } from "@/data/consultant";

// lib
import { userServer } from "@/lib/auth/server";

// utils
import { zdencryption } from "@/utils/admin/encryption";
import { timeZone } from "@/lib/site/time";
import { getFreeSessionByFid } from "@/data/freesession";
import { Reservation } from "@/types/admin";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// props
type Props = {
  params: Promise<{ zid: string }>;
};

// return
export default async function Page({ params }: Props) {
  // zid
  const { zid } = await params;

  // get zdencrypt oid
  const fid = zdencryption(String(zid));

  // validate
  if (!fid) return <Error404 />;

  // get consultant
  const freesession = await getFreeSessionByFid(fid);

  // if not exist
  if (!freesession) return <Error404 />;

  // time and date
  const { time, date } = timeZone();

  // user
  const author = await userServer();

  // check if consultant
  const consultant = author?.id
    ? await getOwnersInfoByAuthor(author?.id)
    : null;

  // new user
  const user = {
    id: author?.id ?? null,
    name: consultant?.name ?? author?.name ?? "عميل شاورني",
    role: author?.role ?? UserRole.USER,
    image: consultant?.image ?? author?.image ?? null,
  };

  // meeting
  const meeting = {
    date: freesession.date,
    time: freesession.time,
    duration: "30",
  } as Meeting;

  // order
  const order = {
    id: freesession.id,
    oid: freesession.fid,
    name: freesession.name,
    consultant: {
      name: freesession.name,
    },
    duration: "30",
  } as unknown as Reservation;

  // return
  return (
    <HMSLayout meeting={meeting} time={time} date={date}>
      <MeetingRoom
        lang="ar"
        order={order}
        user={user}
        duration={meeting.duration}
      />
    </HMSLayout>
  );
}
