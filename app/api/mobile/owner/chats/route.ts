// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerChats, type OwnerChatSummary } from "@/data/mobile/owner-chats";

interface OwnerChats {
  chats: OwnerChatSummary[];
}

// the approved owner's open chats (paid orders, up to 72 hours after the meeting), optionally only
// today's or those matching a search. the client is shown as first name + initial only
export const GET = createGetRoute<OwnerChats>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const params = request.nextUrl.searchParams;
    const filter = params.get("filter") ?? "all";
    const rawQ = params.get("q");
    const q = rawQ === null || rawQ.trim() === "" ? null : rawQ.trim();
    if (filter !== "today" && filter !== "all") throw new HttpError("بيانات خاطئة", 400);
    if (q !== null && (q.length < 2 || q.length > 50)) throw new HttpError("بيانات خاطئة", 400);

    return {
      chats: await getOwnerChats(consultant.cid, { today: filter === "today", q }),
    };
  },
  { errorMessage: "failed to fetch" },
);
