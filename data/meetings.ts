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

// get reservation
export const participantAttendance = async (
  oid: number,
  participant: string,
  ownerAttend: boolean | null,
  clientAttend: boolean | null,
  time: string | null,
  session?: number
) => {
  try {
    // review reminder
    if (
      (participant === "client" && !clientAttend && ownerAttend) ||
      (participant === "owner" && !ownerAttend && clientAttend)
    ) {
      // review reminder
      reviewReminder(oid);
      // session selection (if program)
      await checkProgramNextSession(oid, session ?? 1);
    }

    // client attendance
    if (participant === "client" && !clientAttend) {
      // attendance
      const order = await prisma.meeting.update({
        where: { orderId_session: { orderId: oid, session: session ?? 1 } },
        data: {
          clientAttendance: true,
          clientJoinedAt: time,
        },
        select: { orderId: true },
      });
      // return
      return Boolean(order);
    }

    // attendance
    if (participant === "owner" && !ownerAttend) {
      const order = await prisma.meeting.update({
        where: { orderId_session: { orderId: oid, session: session ?? 1 } },
        data: {
          consultantAttendance: true,
          consultantJoinedAt: time,
        },
        select: { orderId: true },
      });
      // return
      return Boolean(order);
    }

    // if participant not exist or already signed
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
      select: { url: true, duration: true },
    });

    // return
    if (meeting?.url) return meeting.url;

    // create url if not exist
    const newUrl = await createMeeting(Number(meeting?.duration) + 5);

    // update order
    await prisma.meeting.update({
      where: { orderId_session: { orderId: oid, session: session ?? 1 } },
      data: { url: newUrl },
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
  end: string
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
        meeting: true,
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
