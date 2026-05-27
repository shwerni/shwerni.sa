"use server";
import { checkMessageWithAI } from "@/lib/api/ai/chat-guard";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState, UserRole } from "@/lib/generated/prisma/enums";

// lib
import { notificationNewChatMessage } from "@/lib/notifications";
import { timeZone } from "@/lib/site/time";
import { differenceInHours } from "date-fns";

// create a new message
interface NewMessage {
  mid: string;
  content?: string;
  sender?: UserRole;
  participantId: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

export async function createMeetingMessage(payload: NewMessage) {
  // payload validate
  const { mid, content, sender, participantId, fileUrl, fileType, fileName } =
    payload;

  // valdiate
  if (!participantId) return { error: "participantId is required" };

  // valdiate
  if (!content?.trim() && !fileUrl)
    return { error: "Message must have content or a file" };

  try {
    // get meeting
    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      select: {
        mid: true,
        session: true,
        orderId: true,
        participants: true,
        orders: {
          select: {
            name: true,
            phone: true,
            consultant: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // validate
    if (!meeting) return { error: "Meeting not found" };

    // get participant
    const participant = meeting.participants.find(
      (p) => p.participant === participantId,
    );

    // validate
    if (!participant) return { error: "Participant not found in this meeting" };

    // current sender role
    const currentSender = sender ?? participant.role;

    // today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // has message today
    const hasToday = await prisma.orderMessage.findFirst({
      where: {
        meetingId: mid,
        sender: currentSender,
        createdAt: {
          gte: startOfToday,
        },
      },
      select: { id: true },
    });

    // check if first message
    const firstToday = !hasToday;

    // check message for phones or urls
    if (content) {
      const hasContactInfo = await checkMessageWithAI(content);

      // validate
      if (hasContactInfo)
        return {
          error: "عفواً، لا يُسمح بتبادل وسائل التواصل الخارجي أو الروابط.",
        };
    }

    // create message
    const message = await prisma.orderMessage.create({
      data: {
        orderId: meeting.orderId,
        meetingId: mid,
        content: content?.trim() ?? "",
        sender: currentSender,
        fileUrl: fileUrl ?? null,
        fileType: fileType ?? null,
        fileName: fileName ?? null,
      },
    });

    // if first message today, send notification to the receiver
    if (firstToday) {
      // order
      const order = meeting.orders;

      // phone receiver
      const notifyPhone =
        currentSender === UserRole.OWNER ? order.phone : order.consultant.phone;

      // name receiver
      const notifyName =
        currentSender === UserRole.OWNER ? order.name : order.consultant.name;

      // role receiver
      const rparticipant = meeting.participants.find(
        (p) => p.role !== currentSender,
      )?.participant;

      await notificationNewChatMessage(
        notifyPhone,
        notifyName,
        meeting.orderId,
        meeting.session,
        `${meeting.mid}?participant=${rparticipant || ""}`,
      );
    }

    return { success: true, data: message };
  } catch {
    return null;
  }
}

export async function getChatMeeting(mid: string) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      include: {
        participants: true,
        orders: {
          include: {
            payment: {
              select: { payment: true },
            },
            consultant: {
              select: {
                cid: true,
                name: true,
                title: true,
                image: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    return meeting;
  } catch {
    return null;
  }
}

export async function getMeetingData(mid: string) {
  try {
    if (!mid) return;

    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      include: {
        participants: true,
        orders: {
          include: {
            consultant: {
              select: {
                name: true,
                title: true,
                image: true,
              },
            },
          },
        },
        // messages scoped to this meeting
        orderMessages: {
          where: { meetingId: mid },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            sender: true,
            fileUrl: true,
            fileType: true,
            fileName: true,
            createdAt: true,
            blocked: true,
          },
        },
      },
    });

    if (!meeting) return { error: "Meeting not found" };

    return {
      success: true,
      data: {
        mid: meeting.mid,
        date: meeting.date,
        time: meeting.time,
        duration: meeting.duration,
        session: meeting.session,
        order: {
          oid: meeting.orders.oid,
          due_at: meeting.orders.due_at,
          consultant: meeting.orders.consultant,
        },
        participants: meeting.participants,
        messages: meeting.orderMessages,
        blocked: meeting.blocked,
      },
    };
  } catch {
    return null;
  }
}

export async function toggleUserBlock(mid: string, shouldBlock: boolean) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      select: { orderId: true },
    });

    if (!meeting) return { error: "Meeting not found" };

    await prisma.$transaction(async (tx) => {
      // 1. Update the meeting block status
      await tx.meeting.update({
        where: { mid },
        data: { blocked: shouldBlock },
      });

      // 2. If blocking, insert a marker message
      if (shouldBlock) {
        await tx.orderMessage.create({
          data: {
            orderId: meeting.orderId,
            meetingId: mid,
            content: "تم الحظر",
            sender: "OWNER",
            blocked: true,
          },
        });
      }
    });

    return { success: true };
  } catch (err) {
    console.error("[TOGGLE_BLOCK]", err);
    return { error: "Internal error" };
  }
}

export async function getChatList(author: string, role: UserRole) {
  try {
    const isOwner = role === UserRole.OWNER;

    const meetings = await prisma.meeting.findMany({
      where: {
        // scope to this user's meetings based on their role
        orders: isOwner
          ? {
              // OWNER → match via consultant's userId
              consultant: { userId: author },
              payment: { payment: PaymentState.PAID },
            }
          : {
              // CLIENT → match via order.author
              author,
              payment: { payment: PaymentState.PAID },
            },
      },
      include: {
        participants: true,
        orderMessages: {
          where: { blocked: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        orders: {
          include: {
            payment: { select: { payment: true } },
            consultant: {
              select: {
                cid: true,
                name: true,
                image: true,
                gender: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const { iso: nowInRiyadh } = timeZone();

    // Keep only meetings within 72h of their scheduled date+time
    const openMeetings = meetings.filter((m) => {
      try {
        const meetingDateTime = new Date(`${m.date}T${m.time}`);
        if (isNaN(meetingDateTime.getTime())) return false;
        const diffHours = differenceInHours(nowInRiyadh, meetingDateTime);
        return diffHours < 100;
      } catch {
        return false;
      }
    });

    const chats = await Promise.all(
      openMeetings.map(async (m) => {
        const unreadCount = await prisma.orderMessage.count({
          where: {
            meetingId: m.mid,
            sender: { not: role },
            blocked: false,
          },
        });

        const lastMessage = m.orderMessages[0] ?? null;

        // find the participant record that belongs to the current user's role
        const myParticipant = m.participants.find((p) => p.role === role);
        const otherParticipant = m.participants.find((p) => p.role !== role);

        return {
          mid: m.mid,
          session: m.session,
          date: m.date,
          time: m.time,
          orderOid: m.orders.oid,
          clientName: m.orders.name,
          consultant: m.orders.consultant,
          unreadCount,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                fileType: lastMessage.fileType,
                createdAt: lastMessage.createdAt,
                sender: lastMessage.sender,
              }
            : null,
          myParticipantId: myParticipant?.participant ?? null,
          otherParticipantId: otherParticipant?.participant ?? null,
        };
      }),
    );

    return chats;
  } catch {
    return null;
  }
}
