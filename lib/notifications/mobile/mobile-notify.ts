// utils
import prisma from "@/lib/database/db";
import { sendPushNotifications } from "./mobile-push";

interface NotifyInput {
  userId: string;
  title: string;
  message: string;
  // drives tap behavior on the client - omit both for a readonly notification
  type?: string;
  targetId?: string;
}

// pushes to every device registered for a user, right now
export async function pushToUser(
  userId: string,
  title: string,
  message: string,
  type?: string,
  targetId?: string,
  categoryId?: string,
  notificationId?: string,
) {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });

  if (tokens.length === 0) return;

  await sendPushNotifications(
    tokens.map((t) => ({
      to: t.token,
      title,
      body: message,
      data: { type, targetId, notificationId },
      priority: "high",
      sound: "default",
      categoryId,
    })),
  );
}

/**
 * creates a notification row and sends it immediately
 * use for anything triggered by a live user action (booking confirmed, etc.)
 */
export async function sendInstantNotification(input: NotifyInput) {
  if (!input.title.trim() || !input.message.trim()) {
    throw new Error("title and message are required");
  }

  const notification = await prisma.notification.create({
    data: { ...input, timeToSend: new Date(), sent: true, sentAt: new Date() },
  });

  await pushToUser(input.userId, input.title, input.message, input.type, input.targetId);

  return notification;
}

/**
 * creates a notification row for a future time - the cron dispatch route
 * picks it up and sends it once timeToSend has passed
 */
export async function scheduleNotification(input: NotifyInput & { timeToSend: Date }) {
  return prisma.notification.create({ data: { ...input, sent: false } });
}