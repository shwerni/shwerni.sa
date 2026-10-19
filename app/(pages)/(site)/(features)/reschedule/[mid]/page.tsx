// React & Next
import { Metadata } from "next";
import { notFound } from "next/navigation";

// components
import ReschedulePick from "@/components/clients/sub-pages/reschedule/reschedule";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// prisma data
import { getMeeting } from "@/data/meetings";
import { getOwnerByCid } from "@/data/consultant";
import { isRescheduled } from "@/data/reschedule";
import { zdencryption } from "@/utils/admin/encryption";
import { findParticipant } from "@/utils";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - إعادة جدولة الجلسة",
  description:
    "أعد جدولة جلستك بسهولة مع مستشارك عبر منصة شاورني. اختر الوقت المناسب الجديد من جدول الجلسات المتاحة.",
};

// props
type Props = {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{ limit: string; reason: string }>;
};

// default
export default async function Page({ params, searchParams }: Props) {
  // mid
  const { mid } = await params;
  const { limit, reason } = await searchParams;

  // limit to number
  const limitN = zdencryption(limit);

  // validate
  if (!mid) return notFound();

  // get meeting with its order
  const meeting = await getMeeting(mid);

  // rescheduled before
  const rescheduled = await isRescheduled(mid, limitN || 1);

  // validate meeting exists
  if (!meeting) return notFound();

  // full order stays on the server, only used for the checks below
  const fullOrder = meeting.orders;

  // validate order is paid
  if (fullOrder.payment?.payment !== PaymentState.PAID) return notFound();

  // get consultant
  const consultant = await getOwnerByCid(fullOrder.consultantId);

  // validate
  if (!consultant) return notFound();

  // only what the client component renders: no consultant phone or user id,
  // payment shares, other participants or meeting links
  const order = {
    oid: fullOrder.oid,
    name: fullOrder.name,
    sessionCount: fullOrder.sessionCount,
    consultantId: fullOrder.consultantId,
    consultant: { name: fullOrder.consultant.name },
    payment: {
      total: fullOrder.payment.total,
      tax: fullOrder.payment.tax,
      method: fullOrder.payment.method,
    },
    meeting: [
      { date: meeting.date, time: meeting.time, duration: meeting.duration },
    ],
  };

  // return
  return (
    <ReschedulePick
      meeting={{
        mid: meeting.mid,
        date: meeting.date,
        time: meeting.time,
        done: meeting.done,
      }}
      participant={findParticipant(meeting.participants)?.participant}
      order={order}
      rescheduled={rescheduled}
      ireason={Boolean(reason)}
    />
  );
}
