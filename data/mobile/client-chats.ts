import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState, UserRole, type Gender } from "@/lib/generated/prisma/enums";

// data
import {
  CHAT_WINDOW_MS,
  chatStart,
  messageSelect,
  toChatMessage,
  type ChatMessageRow,
  type OwnerChatMessage,
} from "@/data/mobile/owner-chats";

// the consultant as the client sees them in the chat (public fields)
export interface ChatConsultant {
  cid: number;
  name: string;
  image: string | null;
  gender: Gender;
}

// GET /api/mobile/chats -> chats[]
export interface ClientChatSummary {
  mid: string;
  oid: number;
  consultant: ChatConsultant;
  date: string;
  time: string;
  last: { content: string; file: boolean; at: string; mine: boolean } | null;
  unread: number;
}

const consultantSelect = { cid: true, name: true, image: true, gender: true } as const;

/**
 * the messages the client sees: everything except the block markers (the website never shows the
 * client a block; the block only hides the client's later messages from the consultant)
 * @param messages the meeting's messages, oldest first
 */
export const clientVisibleMessages = <T extends Pick<ChatMessageRow, "blocked">>(messages: T[]) =>
  messages.filter((message) => !message.blocked);

/**
 * the consultant's messages the client hasn't read: sent after clientReadAt (null = all), never a
 * block marker
 * @param messages the meeting's messages
 * @param readAt Meeting.clientReadAt
 */
export const clientUnread = (
  messages: Pick<ChatMessageRow, "sender" | "createdAt" | "blocked">[],
  readAt: Date | null,
) =>
  messages.filter(
    (message) =>
      !message.blocked &&
      message.sender === UserRole.OWNER &&
      (readAt === null || message.createdAt > readAt),
  ).length;

/**
 * the client's open chats, newest activity first: the owner list's rules (getOwnerChats) for the
 * orders the client booked (author = the session's user, PAID; the website's getChatList(author,
 * USER)): within 72 hours after the meeting's time, future meetings included; today = dated today
 * (riyadh); q = visible message text (case-insensitive) or the order number, last = the newest match
 * @param userId the session's user id
 * @param options today: only meetings dated today (riyadh); q: the search
 * @param now the current time in ms
 */
export const getClientChats = async (
  userId: string,
  { today, q }: { today: boolean; q: string | null },
  now: number = Date.now(),
): Promise<ClientChatSummary[]> => {
  const riyadhToday = new Date(now + 3 * 3_600_000).toISOString().slice(0, 10);
  // the earliest meeting day that can still be open (4 days covers 72 hours from any time of day)
  const since = new Date(now + 3 * 3_600_000 - 4 * 86_400_000).toISOString().slice(0, 10);

  const meetings = await prisma.meeting.findMany({
    where: {
      date: today ? riyadhToday : { gte: since },
      orders: { author: userId, payment: { payment: PaymentState.PAID } },
    },
    select: {
      mid: true,
      date: true,
      time: true,
      clientReadAt: true,
      orders: { select: { oid: true, consultant: { select: consultantSelect } } },
      orderMessages: { orderBy: { createdAt: "asc" }, select: messageSelect },
    },
  });

  const query = q?.toLowerCase() ?? null;
  const orderQuery = q?.replace(/^#/, "") ?? null;

  const chats = meetings.flatMap((meeting) => {
    const start = chatStart(meeting.date, meeting.time);
    if (!Number.isFinite(start) || now >= start + CHAT_WINDOW_MS) return [];

    const messages = clientVisibleMessages(meeting.orderMessages);

    let last = messages[messages.length - 1] ?? null;
    if (query !== null) {
      const matching = messages.filter((message) =>
        message.content.toLowerCase().includes(query),
      );
      if (matching.length) last = matching[matching.length - 1];
      else if (String(meeting.orders.oid) !== orderQuery) return [];
    }

    return [
      {
        activity: last ? last.createdAt.getTime() : start,
        chat: {
          mid: meeting.mid,
          oid: meeting.orders.oid,
          consultant: meeting.orders.consultant,
          date: meeting.date,
          time: meeting.time,
          last: last
            ? {
                content: last.content,
                file: !!last.fileUrl,
                at: last.createdAt.toISOString(),
                mine: last.sender === UserRole.USER,
              }
            : null,
          unread: clientUnread(meeting.orderMessages, meeting.clientReadAt),
        },
      },
    ];
  });

  return chats.sort((a, b) => b.activity - a.activity).map(({ chat }) => chat);
};

/**
 * one meeting's chat for the client, or null when it isn't theirs: a missing meeting, an order
 * another user booked or an unpaid one all read as null (the routes answer 404)
 * @param userId the session's user id
 * @param mid the meeting id from the url
 */
export const getClientChatMeeting = async (userId: string, mid: string) => {
  const meeting = await prisma.meeting.findUnique({
    where: { mid },
    select: {
      mid: true,
      date: true,
      time: true,
      orders: {
        select: {
          oid: true,
          author: true,
          payment: { select: { payment: true } },
          consultant: { select: consultantSelect },
        },
      },
      orderMessages: { orderBy: { createdAt: "asc" }, select: messageSelect },
    },
  });

  if (
    !meeting ||
    meeting.orders.author !== userId ||
    meeting.orders.payment?.payment !== PaymentState.PAID
  ) {
    return null;
  }

  return meeting;
};

/**
 * the meeting's USER participant token, looked up on the server so the client's message goes
 * through createMeetingMessage as the client; null when the meeting has none
 * @param mid the meeting id (already checked to be the client's own)
 */
export const getClientParticipantId = async (mid: string) =>
  (
    await prisma.participant.findFirst({
      where: { meetingId: mid, role: UserRole.USER },
      select: { participant: true },
    })
  )?.participant ?? null;

/**
 * the thread as the client sees it: no block markers, no blocked flag (always false)
 * @param messages the meeting's messages, oldest first
 */
export const toClientThread = (messages: ChatMessageRow[]): OwnerChatMessage[] =>
  clientVisibleMessages(messages).map((message) => toChatMessage(message, UserRole.USER));
