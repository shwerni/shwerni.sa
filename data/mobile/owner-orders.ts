import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// data
import type { OwnerSession } from "@/data/mobile/owner-sessions";

// GET /api/mobile/owner/orders -> sessions[]: the GET /owner/sessions shape plus the history extras
export interface OwnerOrderSession extends OwnerSession {
  session: number;
  sessions: number;
  done: boolean;
}

/**
 * the order history by day: the same query and select as getOwnerSessions (this consultant's
 * PAID orders, meetings dated in [from, to], riyadh "YYYY-MM-DD"), plus the meeting's session
 * number and the order's session count. no client name / phone, no payment, no meeting url
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param from first riyadh day
 * @param to last riyadh day
 */
export const getOwnerOrders = async (
  cid: number,
  from: string,
  to: string,
): Promise<OwnerOrderSession[]> => {
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
      session: true,
      participants: { select: { attended: true } },
      orders: {
        select: { oid: true, type: true, programId: true, sessionCount: true },
      },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return meetings.map((meeting) => {
    const attendance = meeting.participants.map((participant) => participant.attended);

    return {
      mid: meeting.mid,
      oid: meeting.orders.oid,
      date: meeting.date,
      time: meeting.time,
      duration: Number(meeting.duration) || 0,
      type: meeting.orders.programId ? "PROGRAM" : meeting.orders.type,
      // as GET /owner/sessions (the app's getMeetingStatus): attended needs at least one participant
      status:
        meeting.done || (attendance.length > 0 && attendance.every(Boolean))
          ? "completed"
          : "upcoming",
      session: meeting.session,
      sessions: meeting.orders.sessionCount,
      // the website's rule (dues / orders badge): done, or every participant attended
      done: meeting.done || attendance.every(Boolean),
    };
  });
};
