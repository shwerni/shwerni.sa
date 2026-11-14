// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { mintChatTicket } from "@/lib/api/realtime/chat-ticket";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { CHAT_WINDOW_MS, chatStart, getOwnerChatMeeting } from "@/data/mobile/owner-chats";

interface Params {
  mid: string;
}

// the consultant's chat-join ticket for the realtime server (realtime-chat-plan.md section 12): the
// thread GET's access check (the approved owner's own paid order's meeting), 404 once the chat is
// closed. side OWNER, no peer fields
export const GET = createGetRoute<{ ticket: string }, Params>(
  async (request: NextRequest, context) => {
    const { user, consultant } = await requireApprovedOwner(request);
    const { mid } = await context.params;

    const meeting = await getOwnerChatMeeting(consultant.cid, mid);
    if (!meeting) throw new HttpError("not found", 404);

    // the website: a malformed time never closes the chat
    const start = chatStart(meeting.date, meeting.time);
    if (Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS) {
      throw new HttpError("not found", 404);
    }

    return { ticket: await mintChatTicket({ userId: user.id, mid: meeting.mid, side: "OWNER" }) };
  },
  { errorMessage: "failed to fetch" },
);
