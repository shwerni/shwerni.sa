// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { markChatRead } from "@/data/chat-read";
import { getOwnerChatMeeting } from "@/data/mobile/owner-chats";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

interface Params {
  mid: string;
}

interface ChatRead {
  readAt: string;
}

// the newest message time the app showed (iso)
const ReadSchema = z.object({
  until: z.string().refine((value) => Number.isFinite(Date.parse(value))),
});

// the approved owner read their chat up to `until`: ownerReadAt only moves forward and never past
// now. allowed on a closed chat. anything but their own paid meeting is a 404
export const POST = createPostRoute<ChatRead, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const { mid } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = ReadSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    if (!(await getOwnerChatMeeting(consultant.cid, mid))) throw new HttpError("not found", 404);

    const readAt = await markChatRead(mid, UserRole.OWNER, new Date(parsed.data.until));
    if (!readAt) throw new HttpError("not found", 404);

    return { readAt: readAt.toISOString() };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
