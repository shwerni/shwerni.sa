// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// data
import { markChatRead } from "@/data/chat-read";
import { getClientChatMeeting } from "@/data/mobile/client-chats";

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

// the signed-in client read their chat up to `until`: clientReadAt only moves forward and never
// past now. allowed on a closed chat. anything but their own paid meeting is a 404
export const POST = createPostRoute<ChatRead, Params>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { mid } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = ReadSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    if (!(await getClientChatMeeting(user.id, mid))) throw new HttpError("not found", 404);

    const readAt = await markChatRead(mid, UserRole.USER, new Date(parsed.data.until));
    if (!readAt) throw new HttpError("not found", 404);

    return { readAt: readAt.toISOString() };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
