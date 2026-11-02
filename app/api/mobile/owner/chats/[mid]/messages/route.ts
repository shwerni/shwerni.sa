// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { createMeetingMessage } from "@/data/chats";
import {
  CHAT_WINDOW_MS,
  chatStart,
  getOwnerChatMeeting,
  getOwnerParticipantId,
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

const MessageSchema = z.object({ content: z.string().trim().min(1).max(2000) });

// the approved owner sends a text message in their own paid meeting's chat. the 72-hour window and
// the block are checked here on the server; then the website's createMeetingMessage, with the
// meeting's OWNER participant from the database (its AI contact check and the first-message-of-
// the-day whatsapp notice to the client)
export const POST = createPostRoute<OwnerChatSent, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const { mid } = await context.params;

    const meeting = await getOwnerChatMeeting(consultant.cid, mid);
    if (!meeting) throw new HttpError("not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = MessageSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    const start = chatStart(meeting.date, meeting.time);
    if (Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS) {
      throw new HttpError("تم إغلاق المحادثة", 403);
    }
    if (meeting.blocked) throw new HttpError("تم حظر هذا المستخدم", 403);

    const participantId = await getOwnerParticipantId(mid);
    if (!participantId) throw new Error("meeting has no owner participant");

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

    return { message: toOwnerChatMessage(result.data) };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
