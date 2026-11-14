// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

import { createMeetingMessage } from "@/data/chats";
import { ensureMeetingParticipant } from "@/data/rooms";
import { ChatSendSchema, resolveChatAttachment } from "@/lib/chat/send-input";
import {
  CHAT_WINDOW_MS,
  chatStart,
  getOwnerChatMeeting,
  toOwnerChatMessage,
  type OwnerChatMessage,
} from "@/data/mobile/owner-chats";

interface Params {
  mid: string;
}

interface OwnerChatSent {
  message: OwnerChatMessage;
}

// the website's refusal when a message carries contact details or links (createMeetingMessage)
const CONTACT_INFO_ERROR = "عفواً، لا يُسمح بتبادل وسائل التواصل الخارجي أو الروابط.";

// the approved owner sends a text message, a file (its upload's signed token) or both in their own paid meeting's chat. the 72-hour window is
// checked here on the server; a blocked chat still accepts the consultant's messages, like the
// website (the block stops the client). then the website's createMeetingMessage, with the
// meeting's OWNER participant from the database (its AI contact check and the first-message-of-
// the-day whatsapp notice to the client)
export const POST = createPostRoute<OwnerChatSent, Params>(
  async (request: NextRequest, context) => {
    const { user, consultant } = await requireApprovedOwner(request);
    const { mid } = await context.params;

    const meeting = await getOwnerChatMeeting(consultant.cid, mid);
    if (!meeting) throw new HttpError("not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = ChatSendSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    const start = chatStart(meeting.date, meeting.time);
    if (Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS) {
      throw new HttpError("تم إغلاق المحادثة", 403);
    }

    // after the access check above: a meeting left without this side's participant gets one
    const participantId = await ensureMeetingParticipant(mid, UserRole.OWNER);

    // a file only through its upload's signed token (this user, this chat, 30 minutes, once)
    const file = parsed.data.attachment
      ? await resolveChatAttachment(parsed.data.attachment, user.id, mid)
      : null;

    const result = await createMeetingMessage({
      mid,
      content: parsed.data.content,
      nonce: parsed.data.nonce,
      participantId,
      ...(file && {
        fileUrl: file.url,
        fileName: file.name ?? undefined,
        fileType: file.type ?? undefined,
      }),
    });
    if (result && "error" in result && result.error === CONTACT_INFO_ERROR) {
      throw new HttpError(CONTACT_INFO_ERROR, 400);
    }
    if (!result || !("data" in result) || !result.data) {
      throw new Error("message not saved");
    }

    return { message: toOwnerChatMessage(result.data) };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
