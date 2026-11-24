// React & Next
import { Metadata } from "next";
import { notFound } from "next/navigation";

// components
import ReschedulePick from "@/components/clients/sub-pages/reschedule/reschedule";
import ExpiredRescheduleLink from "@/components/clients/sub-pages/reschedule/expired-link";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// prisma data
import { getMeeting } from "@/data/meetings";
import { getOwnerByCid } from "@/data/consultant";
import { getRescheduleAllowance } from "@/data/reschedule";

// handlers
import { hasMeetingStarted, rescheduleViewer } from "@/handlers/meetings/reschedule";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - إعادة جدولة الجلسة",
  description:
    "أعد جدولة جلستك بسهولة مع مستشارك عبر منصة شاورني. اختر الوقت المناسب الجديد من جدول الجلسات المتاحة.",
};

// props. limit and reason (old dashboard links) are no longer read: the allowance and the
// management reason come from the database (data/reschedule.ts getRescheduleAllowance)
type Props = {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{ participant?: string }>;
};

// default
export default async function Page({ params, searchParams }: Props) {
  // mid
  const { mid } = await params;
  const { participant: token } = await searchParams;

  // validate
  if (!mid) return notFound();

  // get meeting with its order
  const meeting = await getMeeting(mid);

  // the link is the client's access (their own token for this meeting); without it, only the
  // order's logged-in consultant. a bare / old link, a wrong token or no session: the friendly page
  const viewer = meeting ? await rescheduleViewer(mid, token) : null;
  if (!meeting || !viewer) return <ExpiredRescheduleLink />;

  // full order stays on the server, only used for the checks below
  const fullOrder = meeting.orders;

  // validate order is paid
  if (fullOrder.payment?.payment !== PaymentState.PAID) return notFound();

  // get consultant
  const consultant = await getOwnerByCid(fullOrder.consultantId);

  // validate
  if (!consultant) return notFound();

  // may it be rescheduled (again), and is it a staff link's allowance (reason MANAGEMENT)
  const allowance = await getRescheduleAllowance(mid);

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

  // the viewer's own way back to the meeting page: the client's own token, the consultant none
  const client = viewer.side === "client";
  const meetingHref = client
    ? `/meetings/${meeting.mid}?participant=${encodeURIComponent(viewer.participant)}`
    : `/meetings/${meeting.mid}`;

  // return
  return (
    <ReschedulePick
      meeting={{
        mid: meeting.mid,
        date: meeting.date,
        time: meeting.time,
        done: meeting.done,
      }}
      token={client ? viewer.participant : null}
      meetingHref={meetingHref}
      isMeetingAhead={!hasMeetingStarted(meeting.date, meeting.time)}
      order={order}
      rescheduled={!allowance.allowed}
      ireason={allowance.staffGranted}
    />
  );
}
