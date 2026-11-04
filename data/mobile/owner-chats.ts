import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState, UserRole } from "@/lib/generated/prisma/enums";

// a chat is open until 72 hours after the meeting's time (the website closes it at 72 whole hours)
export const CHAT_WINDOW_MS = 72 * 3_600_000;

// the message fields the chat routes read (owner and client)
export const messageSelect = {
  id: true,
  content: true,
  sender: true,
  createdAt: true,
  fileUrl: true,
  fileName: true,
  fileType: true,
  blocked: true,
} as const;

export interface ChatMessageRow {
  id: string;
  content: string;
  sender: UserRole;
  createdAt: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  blocked: boolean;
}

// GET /api/mobile/owner/chats/{mid} -> messages[]
export interface OwnerChatMessage {
  id: string;
  content: string;
  mine: boolean;
  at: string;
  file: { url: string; name: string | null; type: string | null } | null;
  blocked: boolean;
}

/**
 * a meeting's start from its riyadh wall-clock strings, NaN when malformed
 * @param date "YYYY-MM-DD"
 * @param time "HH:mm"
 */
export const chatStart = (date: string, time: string) =>
  Date.parse(`${date}T${time}:00+03:00`);

/**
 * the client as the consultant sees them in the app: the first name and the first letter of the
 * second ("خالد عبدالله" -> "خالد ع."), never the full name or the phone
 * @param name the order's client name
 */
export const clientLabel = (name: string) => {
  const [first = "", second] = name.trim().split(/\s+/);
  return second ? `${first} ${second[0]}.` : first;
};

/**
 * the messages the consultant sees, the website's owner view (components/clients/chats/chat.tsx):
 * while the meeting is blocked, client messages sent at or after the latest block marker are
 * hidden; the markers (blocked: true) stay
 * @param messages the meeting's messages, oldest first
 * @param blocked meeting.blocked
 */
export const ownerVisibleMessages = <T extends Pick<ChatMessageRow, "sender" | "createdAt" | "blocked">>(
  messages: T[],
  blocked: boolean,
) => {
  const markers = blocked ? messages.filter((message) => message.blocked) : [];
  const blockTime = markers.length
    ? markers[markers.length - 1].createdAt.getTime()
    : null;

  return messages.filter(
    (message) =>
      blockTime === null ||
      message.blocked ||
      message.sender === UserRole.OWNER ||
      message.createdAt.getTime() < blockTime,
  );
};

/**
 * a message as the app shows it to one side of the chat
 * @param message the stored message
 * @param reader whose app it is: mine = sent by this role
 */
export const toChatMessage = (
  message: ChatMessageRow,
  reader: UserRole,
): OwnerChatMessage => ({
  id: message.id,
  content: message.content,
  mine: message.sender === reader,
  at: message.createdAt.toISOString(),
  file: message.fileUrl
    ? { url: message.fileUrl, name: message.fileName, type: message.fileType }
    : null,
  blocked: message.blocked,
});

/**
 * a message as the consultant's app shows it
 * @param message the stored message
 */
export const toOwnerChatMessage = (message: ChatMessageRow) =>
  toChatMessage(message, UserRole.OWNER);

// GET /api/mobile/owner/chats -> chats[]
export interface OwnerChatSummary {
  mid: string;
  oid: number;
  client: string;
  date: string;
  time: string;
  last: { content: string; file: boolean; at: string; mine: boolean } | null;
}

/**
 * the consultant's open chats, newest activity first: meetings of their PAID orders (the where of
 * the website's getChatList) within 72 hours after the meeting's time, future meetings included.
 * last = the newest visible message that isn't a block marker (the website list skips markers);
 * with q, only chats whose visible messages contain q (case-insensitive) or whose order number is
 * q, and last = the newest matching message
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param options today: only meetings dated today (riyadh); q: the search
 * @param now the current time in ms
 */
export const getOwnerChats = async (
  cid: number,
  { today, q }: { today: boolean; q: string | null },
  now: number = Date.now(),
): Promise<OwnerChatSummary[]> => {
  const riyadhToday = new Date(now + 3 * 3_600_000).toISOString().slice(0, 10);
  // the earliest meeting day that can still be open (4 days covers 72 hours from any time of day)
  const since = new Date(now + 3 * 3_600_000 - 4 * 86_400_000).toISOString().slice(0, 10);

  const meetings = await prisma.meeting.findMany({
    where: {
      date: today ? riyadhToday : { gte: since },
      orders: { consultantId: cid, payment: { payment: PaymentState.PAID } },
    },
    select: {
      mid: true,
      date: true,
      time: true,
      blocked: true,
      orders: { select: { oid: true, name: true } },
      orderMessages: { orderBy: { createdAt: "asc" }, select: messageSelect },
    },
  });

  const query = q?.toLowerCase() ?? null;
  const orderQuery = q?.replace(/^#/, "") ?? null;

  const chats = meetings.flatMap((meeting) => {
    const start = chatStart(meeting.date, meeting.time);
    if (!Number.isFinite(start) || now >= start + CHAT_WINDOW_MS) return [];

    const messages = ownerVisibleMessages(meeting.orderMessages, meeting.blocked).filter(
      (message) => !message.blocked,
    );

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
          client: clientLabel(meeting.orders.name),
          date: meeting.date,
          time: meeting.time,
          last: last
            ? {
                content: last.content,
                file: !!last.fileUrl,
                at: last.createdAt.toISOString(),
                mine: last.sender === UserRole.OWNER,
              }
            : null,
        },
      },
    ];
  });

  return chats.sort((a, b) => b.activity - a.activity).map(({ chat }) => chat);
};

/**
 * the meeting's OWNER participant token, looked up on the server so the consultant's message goes
 * through createMeetingMessage as the consultant; null when the meeting has none
 * @param mid the meeting id (already checked to be the consultant's own)
 */
export const getOwnerParticipantId = async (mid: string) =>
  (
    await prisma.participant.findFirst({
      where: { meetingId: mid, role: UserRole.OWNER },
      select: { participant: true },
    })
  )?.participant ?? null;

/**
 * one meeting's chat for the consultant, or null when it isn't theirs: a missing meeting, another
 * consultant's order or an unpaid one all read as null (the routes answer 404)
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param mid the meeting id from the url
 */
export const getOwnerChatMeeting = async (cid: number, mid: string) => {
  const meeting = await prisma.meeting.findUnique({
    where: { mid },
    select: {
      mid: true,
      date: true,
      time: true,
      blocked: true,
      orders: {
        select: {
          oid: true,
          name: true,
          consultantId: true,
          payment: { select: { payment: true } },
        },
      },
      orderMessages: { orderBy: { createdAt: "asc" }, select: messageSelect },
    },
  });

  if (
    !meeting ||
    meeting.orders.consultantId !== cid ||
    meeting.orders.payment?.payment !== PaymentState.PAID
  ) {
    return null;
  }

  return meeting;
};
