// packages
import { NextResponse } from "next/server";

// utils
import prisma from "@/lib/database/db";
import {
  sendPushNotifications,
  type PushMessage,
} from "@/lib/notifications/mobile/mobile-push";
import { fanOutCampaign } from "@/lib/notifications/mobile/campaign-fanout";

// caps how many notifications one cron tick claims, so a large backlog
// spreads across runs instead of one oversized batch
const DISPATCH_BATCH_SIZE = 500;

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) =>
  req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

/**
 * claims and fans out any campaigns whose timeToSend has passed - same
 * claim-before-processing pattern as individual notifications below, so
 * an overlapping run can't fan the same campaign out twice
 */
async function dispatchDueCampaigns() {
  const due = await prisma.notificationCampaign.findMany({
    where: { sent: false, timeToSend: { lte: new Date() } },
    select: { id: true },
  });

  if (due.length === 0) return 0;

  const dueIds = due.map((c) => c.id);

  const claimed = await prisma.notificationCampaign.updateMany({
    where: { id: { in: dueIds }, sent: false },
    data: { sent: true, sentAt: new Date() },
  });

  if (claimed.count === 0) return 0;

  const campaigns = await prisma.notificationCampaign.findMany({
    where: { id: { in: dueIds } },
  });

  for (const campaign of campaigns) {
    const sentCount = await fanOutCampaign(campaign);
    await prisma.notificationCampaign.update({
      where: { id: campaign.id },
      data: { sentCount },
    });
  }

  return campaigns.length;
}

// shared by both GET (vercel cron always invokes via GET) and POST
// (manual testing / external schedulers that send POST)
async function dispatchDueNotifications(req: Request) {
  // guard
  if (!isAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dispatchedCampaigns = await dispatchDueCampaigns();

  const due = await prisma.notification.findMany({
    where: { sent: false, timeToSend: { lte: new Date() } },
    take: DISPATCH_BATCH_SIZE,
    select: { id: true },
  });

  if (due.length === 0) {
    return NextResponse.json({ dispatched: 0, dispatchedCampaigns });
  }

  const dueIds = due.map((n) => n.id);

  // claims the batch before sending - if a second run overlaps this one,
  // its updateMany affects zero of these rows since they're no longer sent:false
  const claimed = await prisma.notification.updateMany({
    where: { id: { in: dueIds }, sent: false },
    data: { sent: true, sentAt: new Date() },
  });

  if (claimed.count === 0) {
    return NextResponse.json({ dispatched: 0, dispatchedCampaigns });
  }

  const notifications = await prisma.notification.findMany({
    where: { id: { in: dueIds } },
    include: { user: { include: { pushTokens: true } } },
  });

  notifications
    .filter((n) => n.user.pushTokens.length === 0)
    .forEach((n) =>
      console.warn(
        `[dispatch] notification ${n.id} has no registered push tokens for user ${n.userId}`,
      ),
    );

  const messages: PushMessage[] = notifications.flatMap((n) =>
    n.user.pushTokens.map((t) => ({
      to: t.token,
      title: n.title,
      body: n.message,
      data: { type: n.type, targetId: n.targetId, notificationId: n.id },
      priority: "high" as const,
      sound: "default" as const,
      categoryId: n.actionCategory ?? undefined,
    })),
  );

  await sendPushNotifications(messages);

  return NextResponse.json({
    dispatched: notifications.length,
    dispatchedCampaigns,
  });
}

export const GET = dispatchDueNotifications;
export const POST = dispatchDueNotifications;
