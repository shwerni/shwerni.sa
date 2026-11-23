import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { getUserByPhone } from "./user";
import { writeMeetingLog } from "./meeting-log";

// prisma types
import { PaymentState, Prisma, UserRole } from "@/lib/generated/prisma/client";

// lib
import { meetingTime, timeZone } from "@/utils/date";
import { mainRoute } from "@/constants/links";
import { consultantMeetingUrl } from "@/utils";
import { createGoogleMeeting } from "@/lib/api/google";

// get reservation
export const participantAttendance = async (
  meetingId: string,
  participant: string,
) => {
  try {
    // time
    const { time } = timeZone();

    // participant (only matches while attended is still false, so a row means it changed)
    const updated = await prisma.participant.update({
      where: {
        meetingId_participant: { meetingId, participant },
        attended: false,
      },
      data: { attended: true, time },
      select: {
        role: true,
        meeting: {
          select: { orderId: true, session: true },
        },
      },
    });

    // meeting log: opening the meeting page in its window (customer, no actor). it never throws
    await writeMeetingLog({
      meetingId,
      orderId: updated.meeting.orderId,
      session: updated.meeting.session,
      action: "ATTENDANCE_CHANGED",
      source: "SITE",
      before: { attendance: { [updated.role]: { attended: false } } },
      after: { attendance: { [updated.role]: { attended: true, time } } },
    });

    return true;
  } catch {
    // return
    return null;
  }
};

/**
 * the /meetings page's meeting: getMeeting's fields, but its participants without their tokens
 * (role, attendance and time only). the viewer's own token comes from meetingViewer
 * @param mid the meeting
 */
export const getMeetingForPage = async (mid: string) => {
  try {
    return await prisma.meeting.findUnique({
      where: { mid },
      include: {
        participants: {
          select: { id: true, role: true, attended: true, time: true },
        },
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

/**
 * the whatsapp "meeting link" button's answer (lib/api/whatsapp/logic.ts):
 * - the order's own consultant (the sender's account is this order's consultant): the meeting
 *   page with no token, which asks for his login (the standing rule, CLAUDE.md)
 * - anyone else: the client's link (its USER token), as before. before, any consultant account
 *   got the consultant's token here, even for another consultant's order
 * @param mid the meeting, from the button we sent
 * @param phone the sender's whatsapp number
 */
export const getMeetingUrl = async (mid: string, phone: string) => {
  try {
    // the sender's account, if any
    const user = await getUserByPhone(phone);

    const meeting = await prisma.meeting.findUnique({
      where: {
        mid,
      },
      select: {
        mid: true,
        orderId: true,
        participants: { select: { participant: true, role: true } },
        orders: { select: { consultant: { select: { userId: true } } } },
      },
    });

    // validate
    if (!meeting) return null;

    // this order's consultant: no token in the link
    const consultantUserId = meeting.orders.consultant.userId;
    if (user && consultantUserId && user.id === consultantUserId) {
      return {
        orderId: meeting.orderId,
        url: consultantMeetingUrl(meeting.mid),
      };
    }

    // get participant
    const participant = meeting.participants.find((i) => i.role === UserRole.USER);

    // return
    return {
      orderId: meeting.orderId,
      url: `${mainRoute}meetings/${meeting.mid}?participant=${participant?.participant}`,
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
type SessionFilter = "upcoming" | "completed" | "cancelled" | "packages";

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
      // only what the app's sessions screen reads: no meeting links, participant ids,
      // consultant phone or user id, payment details or program commission
      select: {
        id: true,
        mid: true,
        date: true,
        time: true,
        duration: true,
        session: true,
        done: true,
        participants: { select: { attended: true } },
        orders: {
          select: {
            oid: true,
            packageId: true,
            sessionCount: true,
            payment: { select: { payment: true } },
            program: { select: { title: true } },
            consultant: {
              select: {
                cid: true,
                name: true,
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
