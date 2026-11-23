import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { createNewMeeting } from "./rooms";
import { writeMeetingLog } from "./meeting-log";
import { lockConsultantBookings } from "./booking/lock";
import { isBookableSlot } from "./booking/slots";
import { checkMeetingTimeConflict } from "./order/reserveation";

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
 * the picked session's meeting row, under the consultant's booking lock: the slot is checked
 * again (isBookableSlot and checkMeetingTimeConflict with no own-order exception, as the pick
 * rule says) and the meeting created in one transaction. the caller has checked the order and
 * the session number
 * @returns the new meeting, or null when the slot is taken
 */
export const bookPickedMeeting = async (
  order: NextSessionOrder,
  session: number,
  date: string,
  time: string,
  duration: string,
) =>
  prisma.$transaction(async (tx) => {
    await lockConsultantBookings(tx, order.consultantId);

    if (
      !(await isBookableSlot(order.consultantId, date, time, [], tx)) ||
      (await checkMeetingTimeConflict(order.consultantId, time, date, undefined, tx))
    ) {
      return null;
    }

    return tx.meeting.create({
      data: { orderId: order.oid, duration, session, time, date },
    });
  });

/**
 * after the picked meeting is committed (outside the lock), as before: its log line, its room
 * and participants (createNewMeeting) and the client's confirmation
 * @returns the new meeting's mid
 */
export const finishPickedSession = async (
  order: NextSessionOrder,
  newMeeting: NonNullable<Awaited<ReturnType<typeof bookPickedMeeting>>>,
): Promise<string> => {
  const { session, date, time, duration } = newMeeting;

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
