// React & Next
import { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import MeetingRoom from "@/components/clients/meetings/room";
import HMSLayout from "@/components/clients/meetings/room/laytout";

// prisma types
import { PaymentState, SessionType, UserRole } from "@/lib/generated/prisma/client";

// prisma data
import { getOwnersInfoByAuthor } from "@/data/consultant";
import { getReservationByOid } from "@/data/order/reserveation";

// lib
import { userServer } from "@/lib/auth/server";

// utils
import { zdencryption } from "@/utils/admin/encryption";
import { timeZone } from "@/lib/site/time";

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
  }>;
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { zid } = await params;

  // session
  const { session } = await searchParams;

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
  const { time, date } = timeZone();

  // if not exist
  if (!date || !time) return <Error404 />;

  // user
  const author = await userServer();

  // check if consultant
  const consultant = author?.id
    ? await getOwnersInfoByAuthor(author?.id)
    : null;

  // new user
  const user = author
    ? consultant
      ? {
          id: author.id ?? null,
          name: consultant.name ?? "عميل شاورني",
          role: UserRole.OWNER,
          image: consultant.image ?? null,
        }
      : {
          id: author.id ?? null,
          name: author.name ?? "عميل شاورني",
          role: author.role,
          image: author.image ?? null,
        }
    : {
        id: null,
        name: "عميل شاورني",
        role: UserRole.USER,
        image: null,
      };

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
