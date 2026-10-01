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