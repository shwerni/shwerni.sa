// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// data
import { getClientChats, type ClientChatSummary } from "@/data/mobile/client-chats";

interface ClientChats {
  chats: ClientChatSummary[];
}

// the signed-in client's open chats (orders they booked and paid, up to 72 hours after the
// meeting), optionally only today's or those matching a search, with the unread count per chat
export const GET = createGetRoute<ClientChats>(
  async (request: NextRequest) => {
    const user = await requireMobileUser(request);

    const params = request.nextUrl.searchParams;
    const filter = params.get("filter") ?? "all";
    const rawQ = params.get("q");
    const q = rawQ === null || rawQ.trim() === "" ? null : rawQ.trim();
    if (filter !== "today" && filter !== "all") throw new HttpError("بيانات خاطئة", 400);
    if (q !== null && (q.length < 2 || q.length > 50)) throw new HttpError("بيانات خاطئة", 400);

    return { chats: await getClientChats(user.id, { today: filter === "today", q }) };
  },
  { errorMessage: "failed to fetch" },
);
