// packages
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";

// prisma types
import { VoipTokenType } from "@/lib/generated/prisma/client";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";

// body shape
interface Body {
  token: string;
  type: VoipTokenType;
}

// upserts the caller's voip push token — called once at login and again
// whenever expo-callkit-telecom's useVoIPPushToken hook reports a refresh
export const POST = createPostRoute(async (request: NextRequest) => {
  const user = await requireMobileUser(request);
  const { token, type } = (await request.json()) as Body;

  if (!token || !type) {
    throw new HttpError("token and type are required", 400);
  }

  await prisma.voipPushToken.upsert({
    where: { userId: user.id },
    create: { userId: user.id, token, type },
    update: { token, type },
  });

  return { success: true };
});
