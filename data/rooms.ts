import "server-only";
// prisma
import prisma from "@/lib/database/db";

// utils
import { randomId } from "@/utils/random";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";
import { createGoogleMeeting } from "@/lib/api/google";
import { Meeting } from "@/lib/generated/prisma/client";
import type { MeetingLogSource } from "@/lib/generated/prisma/enums";

// prisma data
import { writeMeetingLog } from "./meeting-log";

// create new room
const createRoom = async (
  roomId: string,
  meetingId: string,
  orderId: number,
  url: string | null,
  session: boolean = false,
) => {
  try {
    // room
    const room = await prisma.room.create({
      data: {
        roomId,
        roomName: orderId + meetingId,
        orderId,
        ...(url ? { url } : {}),
        ...(session ? { sessionId: meetingId } : { meetingId }),
      },
    });

    // participants
    await createParticipants(meetingId);

    return room;
  } catch {
    return null;
  }
};

// create order room participant
const createParticipants = async (mid: string) => {
  try {
    // get order
    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      select: { mid: true },
    });

    // validate
    if (!meeting) return;

    // participant
    await prisma.participant.createMany({
      data: [
        {
          participant: randomId(),
          role: UserRole.USER,
          meetingId: meeting.mid,
        },
        {
          participant: randomId(),
          role: UserRole.OWNER,
          meetingId: meeting.mid,
        },
      ],
    });

    return true;
  } catch {
    return null;
  }
};

/**
 * this meeting's participant token for one side, created when it's missing. a paid meeting can be
 * left without participants: createRoom makes the room first, and when createParticipants fails (it
 * swallows errors) or the request ends in between, every later createRoom fails on the room's
 * unique keys and never makes them. the token is made like createParticipants (randomId, the
 * role, the meeting). one caller at a time per meeting (an advisory lock), so two sends can't make
 * two tokens. the caller must have checked that the user is this side of this meeting
 * @param mid the meeting
 * @param role USER (the client) or OWNER (the consultant)
 */
export async function ensureMeetingParticipant(
  mid: string,
  role: typeof UserRole.USER | typeof UserRole.OWNER,
): Promise<string> {
  const existing = await prisma.participant.findFirst({
    where: { meetingId: mid, role },
    orderBy: { createdAt: "asc" },
    select: { participant: true },
  });
  if (existing) return existing.participant;

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`participant:${mid}`}))`;

    const again = await tx.participant.findFirst({
      where: { meetingId: mid, role },
      orderBy: { createdAt: "asc" },
      select: { participant: true },
    });
    if (again) return again.participant;

    const created = await tx.participant.create({
      data: { participant: randomId(), role, meetingId: mid },
      select: { participant: true },
    });
    console.error(`[participants] mid=${mid} had no ${role} participant, created one`);
    return created.participant;
  });
}

// source is only for the meeting log: SYSTEM when the order became PAID (onPaymentSuccess),
// SITE when the customer picks the next session (selectSession)
export async function createNewMeeting(
  meeting: Meeting,
  source: MeetingLogSource = "SYSTEM",
) {
  try {
    // room name
    const roomName = meeting.orderId + meeting.mid;

    // create room
    const url = await createGoogleMeeting();

    // validate
    // if (!url) return;

    // create room
    const room = await createRoom(
      roomName,
      meeting.mid,
      meeting.orderId,
      url || null,
    );

    // validate
    if (!room) return null;

    // get meeting
    const newMeeting = await prisma.meeting.findUnique({
      where: { mid: meeting.mid },
      include: {
        participants: true,
        rooms: true,
      },
    });

    // meeting log: room (and participants) created. last step, and it never throws
    await writeMeetingLog({
      meetingId: meeting.mid,
      orderId: meeting.orderId,
      session: meeting.session,
      action: "ROOM_CREATED",
      source,
      before: null,
      after: { url: room.url ?? null },
    });

    // return
    return newMeeting;
  } catch {
    return null;
  }
}
