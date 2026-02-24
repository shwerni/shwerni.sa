// React & Next
import { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import MeetingRoom from "@/components/clients/meetings/room";
import HMSLayout from "@/components/clients/meetings/room/laytout";

// prisma types
import { PaymentState, UserRole } from "@/lib/generated/prisma/client";

// prisma data
import { getOwnersInfoByAuthor } from "@/data/consultant";
import { getReservationByOid } from "@/data/order/reserveation";

// lib
import { userServer } from "@/lib/auth/server";

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
    mid?: string;
  }>;
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { zid } = await params;

  // session
  const { session, participant, mid } = await searchParams;

  // get zdencrypt oid
  const oid = zdencryption(String(zid));

  // validate
  if (!oid || !participant) return <Error404 />;

  // get consultant
  const order = await getReservationByOid(oid);
  // const meeting = await getMeeting(mid);

  // if not exist
  if (!order || order.payment?.payment !== PaymentState.PAID)
    return <Error404 />;

  // meeting // later remove meeting validation
  const meeting = order.meeting[(Number(session) || 1) - 1];

  // validate
  if (!meeting) return <Error404 />;

  // user
  const author = await userServer();

  // check if consultant
  const consultant =
    author?.role === UserRole.OWNER
      ? await getOwnersInfoByAuthor(author?.id)
      : null;

  // new user
  const user = {
    id: author?.id ?? null,
    name: consultant?.name ?? author?.name ?? "عميل شاورني",
    role: author?.role ?? UserRole.USER,
    image: consultant?.image ?? author?.image ?? null,
  };

  // return
  return (
    <HMSLayout meeting={meeting}>
      <MeetingRoom
        mid={mid || ""}
        lang="ar"
        order={order}
        user={user}
        duration={meeting.duration}
        participant={participant}
      />
    </HMSLayout>
  );
}
