// utils
import prisma from "@/lib/database/db";
import { pushToUser } from "./mobile-notify";

export interface SendNotificationInput {
  userId: string;
  // "instant" pushes right away, "scheduled" writes a row the cron
  // dispatch route picks up once timeToSend passes
  type: "instant" | "scheduled";
  title: string;
  description: string;
  // a known category from constants/notifications.ts on the client (e.g.
  // "MARKETING_CONSULTANTS", "SESSION_REMINDER") - pair with targetId if
  // that category's route needs one. takes priority over `redirection`
  category?: string | null;
  targetId?: string | null;
  // a literal path for a fully custom, one-off notification with no
  // fixed category - ignored if `category` is set
  redirection?: string | null;
  ctaLabel?: string | null;
  // required when type is "scheduled", ignored for "instant"
  timeToSend?: Date;
  // a key from NOTIFICATION_CATEGORY (see notification-categories.ts on
  // the client) - attaches os-level action buttons to the push itself
  actionCategory?: string;
}

/**
 * single entry point for creating and sending a notification - use this
 * everywhere instead of touching prisma or the push service directly
 */
export async function sendNotification(input: SendNotificationInput) {
  if (!input.title.trim() || !input.description.trim()) {
    throw new Error("title and description are required");
  }

  if (input.type === "scheduled" && !input.timeToSend) {
    throw new Error("timeToSend is required for scheduled notifications");
  }

  const type = input.category ?? (input.redirection ? "LINK" : null);
  const targetId = input.category
    ? input.targetId ?? null
    : input.redirection ?? null;

  const row = {
    userId: input.userId,
    title: input.title,
    message: input.description,
    type,
    targetId,
    ctaLabel: input.ctaLabel ?? null,
    actionCategory: input.actionCategory ?? null,
  };

  if (input.type === "instant") {
    const notification = await prisma.notification.create({
      data: { ...row, timeToSend: new Date(), sent: true, sentAt: new Date() },
    });

    await pushToUser(
      input.userId,
      input.title,
      input.description,
      type ?? undefined,
      targetId ?? undefined,
      input.actionCategory,
      notification.id,
    );

    return notification;
  }

  return prisma.notification.create({
    data: { ...row, timeToSend: input.timeToSend!, sent: false },
  });
}