"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { getUserByPhone } from "./user";

// prisma types
import { PaymentState, Prisma, UserRole } from "@/lib/generated/prisma/client";

// lib
import { timeZone } from "@/lib/site/time";
import { mainRoute } from "@/constants/links";
import { createGoogleMeeting } from "@/lib/api/google";
import { meetingTime } from "@/utils/date";

// get reservation
export const participantAttendance = async (
  meetingId: string,
  participant: string,
) => {
  try {
    // time
    const { time } = timeZone();

    // participant
    await prisma.participant.update({
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

    return true;
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
    const newUrl = await createGoogleMeeting();

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
          select: { userId: true, name: true, phone: true },
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
        rooms: { select: { url: true } },
        orders: {
          include: {
            payment: true,
            consultant: {
              select: { userId: true, name: true, phone: true, image: true },
            },
          },
        },
      },
    });

    return meeting;
  } catch {
    return null;
  }
};

export const getMeetingUrl = async (mid: string, phone: string) => {
  try {
    // check if consultant
    const user = await getUserByPhone(phone);

    // role
    const role =
      user && user.role === UserRole.OWNER ? UserRole.OWNER : UserRole.USER;

    const meeting = await prisma.meeting.findUnique({
      where: {
        mid,
      },
      include: {
        participants: true,
      },
    });

    // get participant
    const participant = meeting?.participants.find((i) => i.role === role);

    // return
    return {
      orderId: meeting?.orderId,
      url: `${mainRoute}meetings/${meeting?.mid}?participant=${participant?.participant}`,
    };
  } catch {
    return null;
  }
};

// is meeting needs reschedule
export const isMeetingNeedsReschedule = async (mid: string) => {
  // meeting
  const meeting = await prisma.meeting.findUnique({
    where: {
      mid,
    },
    select: { orderId: true, date: true, time: true, done: true },
  });

  // validate
  if (!meeting) return null;

  // time
  const { time, date } = timeZone();

  // meetings status
  const status = meetingTime(time, date, meeting.time, meeting.date);

  // if done
  if (meeting.done) return null;

  // passed
  if (status === false)
    // return
    return meeting;
};

// get user meetings
export type SessionFilter = "upcoming" | "completed" | "cancelled" | "packages";

interface GetMeetingsParams {
  userId: string;
  status: SessionFilter;
  cursor?: string;
  limit?: number;
}

// only these two states count as a real, valid order - anything else
// (new/processing/hold/refused/canceled) is treated as cancelled
const VALID_PAYMENT_STATES: PaymentState[] = ["PAID", "REFUND"];

// guards against prisma's `every` being vacuously true on an empty relation
const bothAttendedOrDone: Prisma.MeetingWhereInput = {
  OR: [
    { done: true },
    { participants: { some: {}, every: { attended: true } } },
  ],
};

/**
 * build the meeting where clause for a given status tab
 * @param userId session user id, matched against the order's author
 * @param status which sessions tab is being requested
 */
function buildWhere(
  userId: string,
  status: SessionFilter,
): Prisma.MeetingWhereInput {
  if (status === "packages") {
    return {
      orders: {
        author: userId,
        packageId: { not: null },
        payment: { payment: { in: VALID_PAYMENT_STATES } },
      },
    };
  }

  const validOrder: Prisma.MeetingWhereInput["orders"] = {
    author: userId,
    packageId: null,
    payment: { payment: { in: VALID_PAYMENT_STATES } },
  };

  if (status === "cancelled") {
    return {
      orders: {
        author: userId,
        packageId: null,
        payment: { payment: { notIn: VALID_PAYMENT_STATES } },
      },
    };
  }

  if (status === "completed") {
    return { orders: validOrder, ...bothAttendedOrDone };
  }

  return { orders: validOrder, NOT: bothAttendedOrDone };
}

/**
 * fetch a page of a user's meetings for the given status tab
 * @param params user id, status tab, pagination cursor, and page size
 */
export const getMeetings = async ({
  userId,
  status,
  cursor,
  limit = 10,
}: GetMeetingsParams) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: buildWhere(userId, status),
      orderBy:
        status === "upcoming"
          ? [{ date: "asc" }, { time: "asc" }]
          : [{ date: "desc" }, { time: "desc" }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { mid: cursor } } : {}),
      include: {
        participants: true,
        rooms: { select: { url: true } },
        orders: {
          include: {
            payment: true,
            program: true,
            consultant: {
              select: {
                userId: true,
                name: true,
                phone: true,
                image: true,
                gender: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const hasMore = meetings.length > limit;
    const page = hasMore ? meetings.slice(0, limit) : meetings;

    return {
      meetings: page,
      nextCursor: hasMore ? page[page.length - 1].mid : null,
    };
  } catch {
    return { meetings: [], nextCursor: null };
  }
};
