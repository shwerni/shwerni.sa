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

  // order
  const order = {
    ...meeting.orders,
    meeting: [meeting],
  };

  // validate order is paid
  if (!order || order.payment?.payment !== PaymentState.PAID) return notFound();

  // get consultant
  const consultant = await getOwnerByCid(order.consultantId);

  // validate
  if (!consultant) return notFound();

  // return
  return (
    <ReschedulePick
      meeting={meeting}
      order={order}
      rescheduled={rescheduled}
      ireason={Boolean(reason)}
    />
  );
}
