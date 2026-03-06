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
import { getFreeSessionByFid } from "@/data/freesession";

// types
import { Reservation } from "@/types/admin";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// props
type Props = {
  params: Promise<{ zid: string }>;
  searchParams: Promise<{ participant: string }>;
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { zid } = await params;

  // params
  const { participant } = await searchParams;

  // get zdencrypt oid
  const fid = zdencryption(String(zid));

  // validate
  if (!fid) return <Error404 />;

  // get consultant
  const freesession = await getFreeSessionByFid(fid);

  // if not exist
  if (!freesession) return <Error404 />;

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
      name: freesession.consultant.name,
    },
    duration: "30",
  } as unknown as Reservation;

  // return
  return (
    <HMSLayout meeting={meeting}>
      <MeetingRoom
        lang="ar"
        order={order}
        user={user}
        duration={meeting.duration}
        participant={participant}
        mid={freesession.id}
      />
    </HMSLayout>
  );
}
