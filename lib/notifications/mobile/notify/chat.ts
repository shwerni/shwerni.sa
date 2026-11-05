import "server-only";

// React & Next
import { after } from "next/server";

// lib
import prisma from "@/lib/database/db";
import { notificationNewChatMessage } from "@/lib/notifications/site";
import { sendPushNotificationsDetailed } from "@/lib/notifications/mobile/mobile-push";

// data
import { clientLabel } from "@/data/mobile/owner-chats";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// a push token not seen (registered by the app) for this long is inactive for chat
const ACTIVE_TOKEN_MS = 30 * 86_400_000;
// the push body is cut here; the full text is in the chat
const BODY_MAX = 150;
// ios: the line under the sender's name, so the push reads as a message
const SUBTITLE = "رسالة جديدة";

/**
 * one line per message saying which channel was used (the meeting id and the reason only: no
 * names, phones or text), to trace what the receiver got
 * @param mid the meeting id
 * @param outcome what happened
 */
const logChannel = (mid: string, outcome: string) => console.info(`[chat] mid=${mid} ${outcome}`);

// what createMeetingMessage has once the message is saved
export interface ChatMessageNotice {
  sender: UserRole;
  message: { id: string; content: string; fileUrl: string | null };
  meeting: {
    mid: string;
    session: number;
    orderId: number;
    blocked: boolean;
    clientReadAt: Date | null;
    ownerReadAt: Date | null;
    participants: { participant: string; role: UserRole }[];
    orders: {
      author: string;
      name: string;
      phone: string;
      consultant: { userId: string | null; name: string; phone: string };
    };
  };
}

// riyadh midnight of an instant (riyadh has no dst)
const riyadhDayStart = (now: number) => {
  const day = new Date(now + 3 * 3_600_000).toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00+03:00`);
};

/**
 * the website's whatsapp notice to the receiver (template session_chat_notify, a link with the
 * receiver's participant token), unchanged
 * @param notice the saved message and its meeting
 */
const sendChatWhatsapp = async ({ sender, meeting }: ChatMessageNotice) => {
  const order = meeting.orders;
  const toClient = sender === UserRole.OWNER;
  const receiverToken = meeting.participants.find((p) => p.role !== sender)?.participant;

  await notificationNewChatMessage(
    toClient ? order.phone : order.consultant.phone,
    toClient ? order.name : order.consultant.name,
    meeting.orderId,
    meeting.session,
    `${meeting.mid}?participant=${receiverToken || ""}`,
  );
};

/**
 * tell the receiver about a new chat message, by the channel rule (app docs/client/chats/spec.md §4):
 * - a blocked meeting and a client sender: nobody (the consultant can't see the message)
 * - the receiver has app tokens seen in the last 30 days: a chat push to each, for every message, no
 *   notification row, no whatsapp. if no token accepted it (all dead, or expo failed), the whatsapp
 *   goes out for this message, whatever the time of day
 * - no active tokens: the whatsapp as before, for the sender's first message of the riyadh day
 *   (decided 2026-11-04; it was the server's utc midnight)
 * never throws: a failure is logged and never reaches the sender
 * @param notice the saved message and its meeting
 * @param now the current time in ms
 */
export async function notifyChatMessage(
  notice: ChatMessageNotice,
  now: number = Date.now(),
): Promise<void> {
  const { sender, message, meeting } = notice;
  const fromClient = sender !== UserRole.OWNER;

  if (meeting.blocked && fromClient) {
    logChannel(meeting.mid, "none (blocked client)");
    return;
  }

  const receiverRole = fromClient ? UserRole.OWNER : UserRole.USER;
  const receiverId = fromClient ? meeting.orders.consultant.userId : meeting.orders.author;

  const tokens = receiverId
    ? await prisma.pushToken.findMany({
        where: { userId: receiverId, lastSeenAt: { gte: new Date(now - ACTIVE_TOKEN_MS) } },
        select: { token: true },
      })
    : [];

  if (tokens.length) {
    // the receiver's unread messages in this chat (the visible ones from the sender's side)
    const readAt = fromClient ? meeting.ownerReadAt : meeting.clientReadAt;
    const unread = await prisma.orderMessage.count({
      where: {
        meetingId: meeting.mid,
        blocked: false,
        sender: fromClient ? { not: UserRole.OWNER } : UserRole.OWNER,
        ...(readAt ? { createdAt: { gt: readAt } } : {}),
      },
    });

    const name = fromClient ? clientLabel(meeting.orders.name) : meeting.orders.consultant.name;
    const text = message.content.trim();
    const body = text
      ? text.length > BODY_MAX
        ? `${text.slice(0, BODY_MAX)}…`
        : text
      : "📎 ملف مرفق";

    const delivery = await sendPushNotificationsDetailed(
      tokens.map(({ token }) => ({
        to: token,
        title: unread > 1 ? `${name} (${unread})` : name,
        subtitle: SUBTITLE,
        body,
        data: { type: "CHAT_MESSAGE", targetId: meeting.mid, role: receiverRole },
        categoryId: "chatMessage",
        channelId: "chat",
        tag: meeting.mid,
        threadId: meeting.mid,
        priority: "high" as const,
        sound: "default" as const,
      })),
    );

    if (delivery.accepted.length === 0) {
      logChannel(meeting.mid, `whatsapp (push not accepted: 0/${tokens.length}, ${delivery.dead.length} dead)`);
      await sendChatWhatsapp(notice);
      return;
    }
    logChannel(meeting.mid, `push (${delivery.accepted.length}/${tokens.length} accepted), no whatsapp`);
    return;
  }

  // no app: the sender's first message of the riyadh day in this chat (this message left out)
  const earlierToday = await prisma.orderMessage.count({
    where: {
      meetingId: meeting.mid,
      sender,
      id: { not: message.id },
      createdAt: { gte: riyadhDayStart(now) },
    },
  });
  if (earlierToday === 0) {
    logChannel(meeting.mid, "whatsapp (no active app token, first message of the riyadh day)");
    await sendChatWhatsapp(notice);
    return;
  }
  logChannel(meeting.mid, "none (no active app token, not the first message of the riyadh day)");
}

// after the response (next's after()), so a notice never delays or fails the send; outside a
// request scope it runs in the background
export function scheduleChatMessageNotice(notice: ChatMessageNotice): void {
  const task = () =>
    notifyChatMessage(notice).catch((error) =>
      console.error(`[chat] mid=${notice.meeting.mid} notice failed`, error),
    );
  try {
    after(task);
  } catch {
    void task();
  }
}
