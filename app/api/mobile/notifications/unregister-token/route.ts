// packages
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { HttpError } from "@/lib/api/http-error";
import prisma from "@/lib/database/db";

interface Body {
  expoPushToken?: unknown;
  voipToken?: unknown;
}

const isToken = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 512;

// called by the app right before sign-out: detaches this device's push and voip tokens
// from the signed-in user only, so the next person on the device never gets their
// notifications or calls. other users' and other devices' tokens are never touched
export const POST = createPostRoute(async (request: NextRequest) => {
  const user = await requireMobileUser(request);
  const { expoPushToken, voipToken } = ((await request
    .json()
    .catch(() => ({}))) ?? {}) as Body;

  const hasPush = isToken(expoPushToken);
  const hasVoip = isToken(voipToken);

  if (!hasPush && !hasVoip) {
    throw new HttpError("expoPushToken or voipToken is required", 400);
  }

  await Promise.all([
    hasPush
      ? prisma.pushToken.deleteMany({
          where: { token: expoPushToken, userId: user.id },
        })
      : null,
    hasVoip
      ? prisma.voipPushToken.deleteMany({
          where: { token: voipToken, userId: user.id },
        })
      : null,
  ]);

  return { success: true };
});
