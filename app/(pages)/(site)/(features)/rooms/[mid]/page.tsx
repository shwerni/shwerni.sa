// React & Next
import { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import MeetingRoom from "@/components/clients/meetings/room";
import HMSLayout from "@/components/clients/meetings/room/laytout";

// prisma types
import { PaymentState, UserRole } from "@/lib/generated/prisma/client";

// lib
import { userServer } from "@/lib/auth/server";

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

  // user
  const author = await userServer();

  // participant info
  const participantInfo = meeting.participants.find(
    (p) => participant === p.participant,
  );
  
  // validate
  if (!participantInfo) return <Error404 />;

  // participant name
  const participantRole = participantInfo?.role ?? UserRole.USER;

  // participant name
  const participantName =
    participantRole === UserRole.OWNER
      ? meeting.orders.consultant?.name
      : meeting.orders.name;

  // participant image
  const participantImage =
    participantRole === UserRole.OWNER
      ? meeting.orders.consultant?.image
      : author?.image;

  // new user
  const user = {
    id: participant,
    name: participantName ?? "عميل شاورني",
    role: participantRole,
    image: participantImage ?? null,
  };

  // return
  return (
    <HMSLayout meeting={meeting}>
      <MeetingRoom
        lang="ar"
        mid={mid}
        user={user}
        order={meeting.orders}
        duration={meeting.duration}
        participant={participant}
      />
    </HMSLayout>
  );
}
