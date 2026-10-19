// React & Next
import { Metadata } from "next";
import { notFound } from "next/navigation";

// componenets

// utils
import { dencryptionDigitsToUrl } from "@/utils/admin/encryption";

// prisma types
import { PaymentState, SessionType } from "@/lib/generated/prisma/enums";

// prisma data
import { getOwnerByCid } from "@/data/consultant";
import { getReservationByOid } from "@/data/order/reserveation";
import SessionPick from "@/components/clients/sub-pages/sessions/sessions";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - حجز الجلسة القادمة",
  description:
    "احجز جلستك القادمة بسهولة مع مستشارك عبر منصة شاورني. اختر الوقت المناسب لك من جدول الجلسات المتاحة.",
};

// props
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    session?: string;
  }>;
};

// default
export default async function Page({ params, searchParams }: Props) {
  // id
  const { id } = await params;

  // url params
  const { session } = await searchParams;

  // session
  const nSession = Number(session);

  // oid
  const oid = dencryptionDigitsToUrl(id);

  // validate
  if (!oid) return notFound();

  // get order
  const order = await getReservationByOid(oid);

  // validate
  if (
    !order ||
    order.session !== SessionType.MULTIPLE ||
    !session ||
    order.payment?.payment !== PaymentState.PAID
  )
    notFound();

  // get consultant
  const consultant = await getOwnerByCid(order.consultantId);

  // validate
  if (!consultant) return notFound();

  // validate
  const validate =
    order.meeting[nSession - 2] &&
    order.meeting[nSession - 1] === undefined &&
    nSession <= order.sessionCount;

  // validate
  if (!validate) return notFound();

  // only what the client component renders: no consultant phone or user id,
  // payment shares, used coupon, guest, participants or program commission
  const program = order.program ? { title: order.program.title } : null;
  const picked = {
    oid: order.oid,
    name: order.name,
    sessionCount: order.sessionCount,
    consultantId: order.consultantId,
    consultant: { name: order.consultant.name },
    payment: order.payment
      ? {
          total: order.payment.total,
          tax: order.payment.tax,
          method: order.payment.method,
        }
      : null,
    program,
    meeting: order.meeting.map((m) => ({
      date: m.date,
      time: m.time,
      duration: m.duration,
    })),
  };

  // return
  return <SessionPick order={picked} program={program} session={nSession} />;
}
