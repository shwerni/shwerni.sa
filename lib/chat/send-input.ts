import "server-only";

// packages
import { z } from "zod";

// utils
import { HttpError } from "@/lib/api/http-error";
import { readChatAttachment, type ChatAttachment } from "@/lib/api/realtime/chat-attachment";

// prisma data
import { chatFileAlreadySent } from "@/data/chats";

/**
 * the app's chat send body (both sides): text, an attachment token from the chat upload, or both;
 * nonce = the app's own id for the message, echoed on its live copy. a text-only body as before
 */
export const ChatSendSchema = z
  .object({
    content: z.string().trim().min(1).max(2000).optional(),
    attachment: z.string().min(1).max(4096).optional(),
    nonce: z.string().min(1).max(64).optional(),
  })
  .refine((body) => body.content !== undefined || body.attachment !== undefined);

const BAD_ATTACHMENT = "المرفق غير صالح أو انتهت صلاحيته، برجاء رفعه مرة أخرى";

/**
 * the file of an attachment token for this user and this chat: signed by the chat upload, not
 * expired (30 minutes), the same user and meeting, and not sent already (single use)
 * @throws HttpError 400 otherwise
 */
export async function resolveChatAttachment(
  token: string,
  userId: string,
  mid: string,
): Promise<ChatAttachment> {
  const file = await readChatAttachment(token, { userId, mid });
  if (!file || (await chatFileAlreadySent(mid, file.url))) {
    throw new HttpError(BAD_ATTACHMENT, 400);
  }
  return file;
}
