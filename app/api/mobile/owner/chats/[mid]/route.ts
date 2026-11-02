// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import {
  CHAT_WINDOW_MS,
  chatStart,
  clientLabel,
  getOwnerChatMeeting,
  ownerVisibleMessages,
  toOwnerChatMessage,
  type OwnerChatMessage,
} from "@/data/mobile/owner-chats";

interface Params {
  mid: string;
}

interface OwnerChatThread {
  chat: { mid: string; oid: number; client: string; closed: boolean; blocked: boolean };
  messages: OwnerChatMessage[];
}

// one chat of the approved owner: their own paid order's meeting only (anything else is a 404), the
// messages as the website shows them to the consultant (client messages after a block hidden)
export const GET = createGetRoute<OwnerChatThread, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const { mid } = await context.params;

    const meeting = await getOwnerChatMeeting(consultant.cid, mid);
    if (!meeting) throw new HttpError("not found", 404);

    // the website: a malformed time never closes the chat
    const start = chatStart(meeting.date, meeting.time);
    const closed = Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS;

    return {
      chat: {
        mid: meeting.mid,
        oid: meeting.orders.oid,
        client: clientLabel(meeting.orders.name),
        closed,
        blocked: meeting.blocked,
      },
      messages: ownerVisibleMessages(meeting.orderMessages, meeting.blocked).map(
        toOwnerChatMessage,
      ),
    };
  },
  { errorMessage: "failed to fetch" },
);
