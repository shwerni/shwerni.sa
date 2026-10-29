import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// GET /api/mobile/owner/sessions -> sessions[]
export interface OwnerSession {
  mid: string;
  oid: number;
  date: string;
  time: string;
  duration: number;
  type: "SCHEDULED" | "INSTANT" | "PROGRAM";
  status: "upcoming" | "completed" | "cancelled";
}

/**
 * the consultant's meetings dated in [from, to] (riyadh "YYYY-MM-DD", both included), with
 * the website's filter (getAllPaidOwnersOrdersByAuthor: this consultant's orders with payment
 * PAID). a mobile select: no client name / phone / email, no consultant phone, no payment rows
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param from first riyadh day
 * @param to last riyadh day
 */
export const getOwnerSessions = async (
  cid: number,
  from: string,
  to: string,
): Promise<OwnerSession[]> => {
  const meetings = await prisma.meeting.findMany({
    where: {
      date: { gte: from, lte: to },
      orders: { consultantId: cid, payment: { payment: PaymentState.PAID } },
    },
    select: {
      mid: true,
      date: true,
      time: true,
      duration: true,
      done: true,
      participants: { select: { attended: true } },
      orders: { select: { oid: true, type: true, programId: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return meetings.map((meeting) => {
    // the app's getMeetingStatus: completed = done or every participant attended. "cancelled"
    // (payment CANCELED) can't occur under the PAID filter
    const attended =
      meeting.participants.length > 0 &&
      meeting.participants.every((participant) => participant.attended);

    return {
      mid: meeting.mid,
      oid: meeting.orders.oid,
      date: meeting.date,
      time: meeting.time,
      duration: Number(meeting.duration) || 0,
      type: meeting.orders.programId ? "PROGRAM" : meeting.orders.type,
      status: meeting.done || attended ? "completed" : "upcoming",
    };
  });
};
