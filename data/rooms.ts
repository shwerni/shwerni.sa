"use server";
// prisma
import prisma from "@/lib/database/db";

// utils
import { randomId } from "@/utils";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";
import { createGoogleMeeting } from "@/lib/api/google";
import { Meeting } from "@/lib/generated/prisma/client";

// get created room
export const getRoom = async (roomName: string) => {
  try {
    const room = await prisma.room.findUnique({
      where: { roomName },
    });

    return room;
  } catch {
    return null;
  }
};

// create new room
export const createRoom = async (
  roomId: string,
  meetingId: string,
  orderId: number,
  url: string,
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
export const createParticipants = async (mid: string) => {
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

// order room
export const getParticipants = async (meetingId: string, role: UserRole) => {
  try {
    // participant
    const participant = await prisma.participant.findFirst({
      where: {
        meetingId,
        role,
      },
      select: {
        participant: true,
      },
    });

    return participant?.participant;
  } catch {
    return null;
  }
};

export async function createNewMeeting(meeting: Meeting) {
  try {
    // room name
    const roomName = meeting.orderId + meeting.mid;

    // create room
    const url = await createGoogleMeeting();

    // validate
    if (!url) return;

    // create room
    const room = await createRoom(roomName, meeting.mid, meeting.orderId, url);

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

    // return
    return newMeeting;
  } catch {
    return null;
  }
}
