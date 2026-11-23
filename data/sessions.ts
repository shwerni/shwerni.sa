import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { createNewMeeting } from "./rooms";
import { writeMeetingLog } from "./meeting-log";

// lib
import { notificationSessionConfirm } from "@/lib/notifications/site";

/**
 * a package / program order whose next session is being picked: what the pick checks (type,
 * payment, its meetings so far) and what the confirmation notice uses. null when missing
 * @param oid the order
 */
export const getOrderForNextSession = async (oid: number) =>
  prisma.order.findUnique({
    where: { oid },
    select: {
      oid: true,
      consultantId: true,
      session: true,
      sessionCount: true,
      name: true,
      phone: true,
      program: { select: { title: true } },
      payment: { select: { payment: true } },
      consultant: { select: { name: true, phone: true } },
      meeting: {
        orderBy: { session: "asc" },
        select: { session: true, duration: true },
      },
    },
  });

export type NextSessionOrder = NonNullable<Awaited<ReturnType<typeof getOrderForNextSession>>>;

/**
 * the picked session's meeting, as before: the meeting row, its log line, its room and
 * participants (createNewMeeting) and the client's confirmation. the caller has checked the
 * order, the session number and the slot
 * @returns the new meeting's mid
 */
export const createPickedSession = async (
  order: NextSessionOrder,
  session: number,
  date: string,
  time: string,
  duration: string,
): Promise<string> => {
  const newMeeting = await prisma.meeting.create({
    data: { orderId: order.oid, duration, session, time, date },
  });

  // meeting log: the customer picked the next session (no actor). it never throws
  await writeMeetingLog({
    meetingId: newMeeting.mid,
    orderId: order.oid,
    session,
    action: "CREATED",
    source: "SITE",
    before: null,
    after: { date, time, duration, session },
  });

  // the room and the participants (logs ROOM_CREATED with the same source)
  await createNewMeeting(newMeeting, "SITE");

  await notificationSessionConfirm(
    order.oid,
    newMeeting.mid,
    order.program
      ? `برنامج ${order.program.title}`
      : `باكدج ${order.sessionCount} جلسات`,
    order.name,
    order.consultant.name,
    order.phone,
    order.consultant.phone,
    session,
    order.sessionCount,
    time,
    date,
  );

  return newMeeting.mid;
};
