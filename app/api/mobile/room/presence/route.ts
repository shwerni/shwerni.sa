// packages
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import prisma from "@/lib/database/db";
import { createPostRoute } from "@/lib/api/routes/route-factory";

// body shape — mid is only sent while the user is on that specific
// meeting's room screen (waiting, pre-join, or connected)
interface Body {
  meetingMid?: string;
}

export const POST = createPostRoute(async (request: NextRequest) => {
  const user = await requireMobileUser(request);
  const { meetingMid } = (await request.json().catch(() => ({}))) as Body;

  await prisma.userPresence.upsert({
    where: { userId: user.id },
    create: { userId: user.id, meetingMid: meetingMid ?? null },
    update: { lastSeenAt: new Date(), meetingMid: meetingMid ?? null },
  });

  return { success: true };
});
