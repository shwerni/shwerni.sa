"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { checkProgramNextSession } from "@/data/program";

// lib
import { createMeeting } from "@/lib/api/google";

// hooks
import { reviewReminder } from "@/handlers/clients/reservation/order";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";

// lib
import { timeZone } from "@/lib/site/time";

// get reservation
export const participantAttendance = async (
  meetingId: string,
  participant: string,
) => {
  try {
    // time
    const { time } = timeZone();

    // participant
    const meeting = await prisma.participant.update({
      where: {
        meetingId_participant: { meetingId, participant },
        attended: false,
      },
      data: { attended: true, time },
      select: {
        meeting: {
          select: { orderId: true, session: true },
        },
      },
    });

    // all participant
    const participants = await prisma.participant.findMany({
      where: {
        meetingId,
      },
      select: {
        attended: true,
      },
    });

    // review reminder
    if (
      participants.every((p) => p.attended === true) &&
      meeting.meeting.orderId
    ) {
      // review reminder
      await reviewReminder(meeting.meeting.orderId, meeting.meeting.session);
      // session selection (if program)
      await checkProgramNextSession(
        meeting.meeting.orderId,
        meeting.meeting.session ?? 1,
      );
    }

    return null;
  } catch {
    // return
    return null;
  }
};

// get meeting url if not exist create
export const orderMeetingUrl = async (oid: number, session?: number) => {
  try {
    // get order url
    const meeting = await prisma.meeting.findUnique({
      where: { orderId_session: { orderId: oid, session: session ?? 1 } },
      select: { rooms: { select: { url: true } }, duration: true },
    });

    // return
    if (meeting?.rooms?.url) return meeting.rooms.url;

    // create url if not exist
    const newUrl = await createMeeting(Number(meeting?.duration) + 5);

    // update order
    await prisma.meeting.update({
      where: { orderId_session: { orderId: oid, session: session ?? 1 } },
      data: { rooms: { update: { url: newUrl } } },
      select: { orderId: true },
    });

    // return
    return newUrl;
  } catch {
    // return
    return null;
  }
};

// get all paid orders for owners (owner order page)
export const getMeetingsByCidAndRange = async (
  cid: number,
  start: string,
  end: string,
) => {
  try {
    // get paid orders created in the specified month and year
    const orders = await prisma.order.findMany({
      where: {
        consultantId: cid,
        payment: { payment: PaymentState.PAID },
        meeting: {
          some: {
            date: {
              gte: start,
              lte: end,
            },
          },
        },
      },
      include: {
        payment: true,
        meeting: {
          include: {
            participants: true,
          },
        },
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // Return orders
    return orders;
  } catch {
    return null;
  }
};

export const getMeeting = async (mid: string) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: {
        mid,
      },
      include: {
        participants: true,
        orders: {
          include: {
            payment: true,
            consultant: { select: { name: true, phone: true, image: true } },
          },
        },
      },
    });

    return meeting;
  } catch {
    return null;
  }
};
