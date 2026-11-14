import "server-only";

// React & Next
import { after } from "next/server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma data
import { toChatMessage, type ChatMessageRow, type OwnerChatMessage } from "@/data/mobile/owner-chats";

// lib
import { INTERNAL_SECRET_HEADER } from "@/lib/auth/internal-secret";

// the realtime server answers in milliseconds; a chat send never waits on it (it runs after the
// response) and gives up after this
const TIMEOUT_MS = 2_000;

// the realtime server's limit on a message's text (the website sets none: a longer one isn't sent
// live, polling and the push still deliver it)
const MAX_CONTENT = 10_000;

type LiveMessage = OwnerChatMessage & { nonce?: string };

// POST /internal/chat-message's body (realtime-chat-plan.md section 12)
export interface ChatMessagePayload {
  mid: string;
  client: LiveMessage | null;
  owner: LiveMessage | null;
}

/**
 * the live message for each side, or null when nothing goes out: the client never sees a block
 * marker; the consultant doesn't see a client message while the meeting is blocked (the website's
 * owner view). the sender's nonce (from the app's send) goes on the sender's side only
 * @param meetingBlocked meeting.blocked when the message was saved
 */
export function chatMessagePayload(
  mid: string,
  message: ChatMessageRow,
  meetingBlocked: boolean,
  nonce?: string,
): ChatMessagePayload | null {
  if (message.content.length > MAX_CONTENT) return null;

  const withNonce = (side: UserRole, live: OwnerChatMessage): LiveMessage =>
    nonce && message.sender === side ? { ...live, nonce } : live;

  const client = message.blocked ? null : withNonce(UserRole.USER, toChatMessage(message, UserRole.USER));
  const owner =
    meetingBlocked && message.sender === UserRole.USER && !message.blocked
      ? null
      : withNonce(UserRole.OWNER, toChatMessage(message, UserRole.OWNER));

  if (!client && !owner) return null;
  return { mid, client, owner };
}

// one call to the realtime server: 2s, never throws, logged on failure (polling and the push cover a miss)
async function postInternal(path: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [INTERNAL_SECRET_HEADER]: process.env.INTERNAL_SHARED_SECRET ?? "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[chat-live] ${path} ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    console.error(
      `[chat-live] ${path} ${timedOut ? `no answer in ${TIMEOUT_MS / 1000}s` : err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// after the response, like consultant-busy: outside a request scope it runs in the background
function schedule(task: () => Promise<void>): void {
  try {
    after(task);
  } catch {
    void task();
  }
}

/**
 * a saved chat message, live to the sockets that have the chat open (the app; the website keeps
 * polling). after the response, never throws, never delays or fails the send
 */
export function scheduleChatMessageLive(
  mid: string,
  message: ChatMessageRow,
  meetingBlocked: boolean,
  nonce?: string,
): void {
  const payload = chatMessagePayload(mid, message, meetingBlocked, nonce);
  if (!payload) return;
  schedule(() => postInternal("/internal/chat-message", payload));
}

// the consultant's open chat reloads (after a block or unblock: the marker and the hidden messages)
export function scheduleChatRefresh(mid: string): void {
  schedule(() => postInternal("/internal/chat-refresh", { mid, side: UserRole.OWNER }));
}
