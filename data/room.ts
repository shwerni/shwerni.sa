"use server";
// prisma
import prisma from "@/lib/database/db";

// utils
import { randomId } from "@/utils";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

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
      select: { mid: true, orderId: true, session: true },
    });

    // validate
    if (!meeting) return;

    // participant
    await prisma.participant.create({
      data: {
        participant: randomId(),
        role: UserRole.USER,
        meetingId: meeting.mid,
      },
    });

    await prisma.participant.create({
      data: {
        participant: randomId(),
        role: UserRole.OWNER,
        meetingId: meeting.mid,
      },
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
