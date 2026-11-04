// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// data
import { CHAT_WINDOW_MS, chatStart, type OwnerChatMessage } from "@/data/mobile/owner-chats";
import {
  getClientChatMeeting,
  toClientThread,
  type ChatConsultant,
} from "@/data/mobile/client-chats";

interface Params {
  mid: string;
}

interface ClientChatThread {
  chat: { mid: string; oid: number; consultant: ChatConsultant; closed: boolean };
  messages: OwnerChatMessage[];
}

// one chat of the signed-in client: their own paid order's meeting only (anything else is a 404).
// never a block marker or a blocked flag: the website never shows the client a block
export const GET = createGetRoute<ClientChatThread, Params>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { mid } = await context.params;

    const meeting = await getClientChatMeeting(user.id, mid);
    if (!meeting) throw new HttpError("not found", 404);

    // the website: a malformed time never closes the chat
    const start = chatStart(meeting.date, meeting.time);
    const closed = Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS;

    return {
      chat: {
        mid: meeting.mid,
        oid: meeting.orders.oid,
        consultant: meeting.orders.consultant,
        closed,
      },
      messages: toClientThread(meeting.orderMessages),
    };
  },
  { errorMessage: "failed to fetch" },
);
