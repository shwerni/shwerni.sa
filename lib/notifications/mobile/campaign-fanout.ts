// utils
import prisma from "@/lib/database/db";
import {
  sendPushNotifications,
  type PushMessage,
} from "@/lib/notifications/mobile/mobile-push";

interface CampaignInput {
  id: string;
  title: string;
  message: string;
  audience: "ALL" | "USER" | "OWNER";
  type: string | null;
  targetId: string | null;
  actionCategory: string | null;
}

/**
 * resolves a campaign's audience into matching user ids
 * @param audience ALL for every client + owner, or a specific role
 */
async function resolveAudience(audience: CampaignInput["audience"]) {
  const users = await prisma.user.findMany({
    where:
      audience === "ALL"
        ? { role: { in: ["USER", "OWNER"] } }
        : { role: audience },
    select: { id: true },
  });

  return users.map((u) => u.id);
}

/**
 * turns one campaign into a Notification row per matching user and pushes
 * to every registered device across that whole audience in one batch -
 * used for both instant campaigns and the cron picking up a scheduled one
 * @returns how many users the campaign actually reached
 */
export async function fanOutCampaign(campaign: CampaignInput) {
  const userIds = await resolveAudience(campaign.audience);

  if (userIds.length === 0) {
    console.warn(
      `[campaign] ${campaign.id} matched zero users for audience ${campaign.audience}`,
    );
    return 0;
  }

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: campaign.title,
      message: campaign.message,
      type: campaign.type,
      targetId: campaign.targetId,
      timeToSend: new Date(),
      sent: true,
      sentAt: new Date(),
    })),
  });

  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
  });

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: campaign.title,
    body: campaign.message,
    data: { type: campaign.type, targetId: campaign.targetId },
    priority: "high",
    sound: "default",
    categoryId: campaign.actionCategory ?? undefined,
  }));

  await sendPushNotifications(messages);

  return userIds.length;
}
