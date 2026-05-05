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

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - إعادة جدولة الجلسة",
  description:
    "أعد جدولة جلستك بسهولة مع مستشارك عبر منصة شاورني. اختر الوقت المناسب الجديد من جدول الجلسات المتاحة.",
};

// props
type Props = {
  params: Promise<{ mid: string }>;
};

// default
export default async function Page({ params }: Props) {
  // mid
  const { mid } = await params;

  // validate
  if (!mid) return notFound();

  // get meeting with its order
  const meeting = await getMeeting(mid);

  // validate meeting exists
  if (!meeting) return notFound();

  // order
  const order = {
    ...meeting.orders,
    meeting: [meeting],
  };

  // validate order is paid and is a multiple-session order
  if (!order || order.payment?.payment !== PaymentState.PAID) return notFound();

  // get consultant
  const consultant = await getOwnerByCid(order.consultantId);

  // validate
  if (!consultant) return notFound();

  // return
  return <ReschedulePick meeting={meeting} order={order} />;
}
