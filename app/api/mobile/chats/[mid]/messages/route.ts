// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// data
import { createMeetingMessage } from "@/data/chats";
import {
  CHAT_WINDOW_MS,
  chatStart,
  toChatMessage,
  type OwnerChatMessage,
} from "@/data/mobile/owner-chats";
import { getClientChatMeeting, getClientParticipantId } from "@/data/mobile/client-chats";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

interface Params {
  mid: string;
}

interface ClientChatSent {
  message: OwnerChatMessage;
}

// the website's refusal when a message carries contact details or links (createMeetingMessage)
const CONTACT_INFO_ERROR = "عفواً، لا يُسمح بتبادل وسائل التواصل الخارجي أو الروابط.";

const MessageSchema = z.object({ content: z.string().trim().min(1).max(2000) });

// the signed-in client sends a text message in their own paid meeting's chat. the 72-hour window is
// checked here on the server; a blocked chat still accepts the message, like the website (the
// consultant doesn't see it). then the website's createMeetingMessage, with the meeting's USER
// participant from the database (its AI contact check and the receiver's notice)
export const POST = createPostRoute<ClientChatSent, Params>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { mid } = await context.params;

    const meeting = await getClientChatMeeting(user.id, mid);
    if (!meeting) throw new HttpError("not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = MessageSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    const start = chatStart(meeting.date, meeting.time);
    if (Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS) {
      throw new HttpError("تم إغلاق المحادثة", 403);
    }

    const participantId = await getClientParticipantId(mid);
    if (!participantId) throw new Error("meeting has no client participant");

    const result = await createMeetingMessage({
      mid,
      content: parsed.data.content,
      participantId,
    });
    if (result && "error" in result && result.error === CONTACT_INFO_ERROR) {
      throw new HttpError(CONTACT_INFO_ERROR, 400);
    }
    if (!result || !("data" in result) || !result.data) {
      throw new Error("message not saved");
    }

    return { message: toChatMessage(result.data, UserRole.USER) };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
