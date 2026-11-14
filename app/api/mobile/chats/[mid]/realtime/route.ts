// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { mintChatTicket } from "@/lib/api/realtime/chat-ticket";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// data
import { getChatPeer } from "@/data/mobile/chat-realtime";
import { CHAT_WINDOW_MS, chatStart } from "@/data/mobile/owner-chats";
import { getClientChatMeeting } from "@/data/mobile/client-chats";

interface Params {
  mid: string;
}

// the client's chat-join ticket for the realtime server (realtime-chat-plan.md section 12): the
// thread GET's access check (their own paid order's meeting), 404 once the chat is closed. the
// ticket carries the consultant's opaque presence key and last seen time, never a user id
export const GET = createGetRoute<{ ticket: string }, Params>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { mid } = await context.params;

    const meeting = await getClientChatMeeting(user.id, mid);
    if (!meeting) throw new HttpError("not found", 404);

    // the website: a malformed time never closes the chat
    const start = chatStart(meeting.date, meeting.time);
    if (Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS) {
      throw new HttpError("not found", 404);
    }

    const peer = await getChatPeer(meeting.mid);
    return { ticket: await mintChatTicket({ userId: user.id, mid: meeting.mid, side: "USER", peer }) };
  },
  { errorMessage: "failed to fetch" },
);
