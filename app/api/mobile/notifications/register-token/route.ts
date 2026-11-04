// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";

// lib
import prisma from "@/lib/database/db";

// mobile platforms allowed to register a push token
const PLATFORMS = ["ios", "android"] as const;

export const POST = createGetRoute(async (request) => {
  const user = await requireMobileUser(request);
  const { expoPushToken, platform } = await request.json();

  if (typeof expoPushToken !== "string" || !expoPushToken.startsWith("ExponentPushToken")) {
    throw new HttpError("invalid push token", 400);
  }

  if (!PLATFORMS.includes(platform)) {
    throw new HttpError("invalid platform", 400);
  }

  // lastSeenAt: the app registers on every open / sign-in; 30 days unseen = inactive for the chat
  // channel rule (the token is kept)
  const now = new Date();
  await prisma.pushToken.upsert({
    where: { token: expoPushToken },
    update: { userId: user.id, platform, lastSeenAt: now },
    create: { token: expoPushToken, userId: user.id, platform, lastSeenAt: now },
  });

  return { success: true };
}, { errorMessage: "failed to fetch" });
