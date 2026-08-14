// packages
import type { NextRequest } from "next/server";

// utils
import { createPostRoute } from "@/lib/api/routes/create-post-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";
import { sendNotification } from "@/lib/notifications/mobile/send-notification";

/**
 * lets the signed-in user trigger a notification to themselves - userId is
 * always derived from the session, never accepted from the request body,
 * so this can't be used to send notifications to another account
 */
export const POST = createPostRoute(async (request: NextRequest) => {
  const user = await requireMobileUser(request);
  const body = await request.json().catch(() => null);

  if (!body?.title || !body?.description || !body?.type) {
    throw new HttpError("title, description, and type are required", 400);
  }

  if (body.type === "scheduled" && !body.timeToSend) {
    throw new HttpError("timeToSend is required for scheduled notifications", 400);
  }

  const notification = await sendNotification({
    userId: user.id,
    type: body.type,
    title: body.title,
    description: body.description,
    category: body.category ?? null,
    targetId: body.targetId ?? null,
    redirection: body.redirection ?? null,
    ctaLabel: body.ctaLabel ?? null,
    actionCategory: body.actionCategory,
    timeToSend: body.timeToSend ? new Date(body.timeToSend) : undefined,
  });

  return { notification };
});