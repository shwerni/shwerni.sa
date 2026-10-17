import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { SessionType } from "@/lib/generated/prisma/client";

// prisma data
import { createNewMeeting } from "./rooms";
import { writeMeetingLog } from "./meeting-log";

// lib
import { notificationSessionConfirm } from "@/lib/notifications/site";

// session selection
export const selectSession = async (
  oid: number,
  time: string,
  date: string,
  session: number,
  duration: string = "60",
) => {
  try {
    // get program
    const order = await prisma.order.findUnique({
      where: { oid },
      include: {
        program: true,
        consultant: {
          select: {userId: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // validate
    if (!order) return false;

    // validate
    if (order.session !== SessionType.MULTIPLE) return false;

    // create meeting
    const newMeeting = await prisma.meeting.create({
      data: {
        orderId: oid,
        duration,
        session,
        time,
        date,
      },
    });

    // validate
    if (!newMeeting) return null;

    // meeting log: the customer picked the next session (no actor). it never throws
    await writeMeetingLog({
      meetingId: newMeeting.mid,
      orderId: oid,
      session,
      action: "CREATED",
      source: "SITE",
      before: null,
      after: { date, time, duration, session },
    });

    // create new meeting (logs ROOM_CREATED with the same source)
    await createNewMeeting(newMeeting, "SITE");

    // meeting
    const meeting = await prisma.meeting.findUnique({
      where: { orderId_session: { orderId: oid, session } },
      select: {
        mid: true,
        participants: true,
      },
    });

    // validate
    if (!meeting) return null;

    // validate
    await notificationSessionConfirm(
      oid,
      meeting?.mid,
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

    // return
    return meeting;
  } catch {
    // return
    return null;
  }
};
