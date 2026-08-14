// utils
import prisma from "@/lib/database/db";
import { fanOutCampaign } from "./campaign-fanout";

export interface SendCampaignInput {
  // "instant" fans out and pushes right away, "scheduled" writes a row
  // the cron dispatch route picks up once timeToSend passes
  type: "instant" | "scheduled";
  title: string;
  description: string;
  audience: "ALL" | "USER" | "OWNER";
  // path opened on tap, e.g. "/consultants" - omit for a readonly campaign
  redirection?: string | null;
  ctaLabel?: string | null;
  // required when type is "scheduled", ignored for "instant"
  timeToSend?: Date;
  // a key from NOTIFICATION_CATEGORY - attaches os-level action buttons
  actionCategory?: string;
}

/**
 * single entry point for sending a mass notification to an entire
 * audience (clients, owners, or everyone) - use this from the admin
 * dashboard instead of writing campaign rows directly
 */
export async function sendCampaign(input: SendCampaignInput) {
  if (!input.title.trim() || !input.description.trim()) {
    throw new Error("title and description are required");
  }

  if (input.type === "scheduled" && !input.timeToSend) {
    throw new Error("timeToSend is required for scheduled campaigns");
  }

  const redirection = input.redirection ?? null;

  const row = {
    title: input.title,
    message: input.description,
    audience: input.audience,
    targetId: redirection,
    type: redirection ? "LINK" : null,
    ctaLabel: input.ctaLabel ?? null,
    actionCategory: input.actionCategory ?? null,
  };

  if (input.type === "instant") {
    const campaign = await prisma.notificationCampaign.create({
      data: { ...row, timeToSend: new Date(), sent: true, sentAt: new Date() },
    });

    const sentCount = await fanOutCampaign({
      id: campaign.id,
      title: campaign.title,
      message: campaign.message,
      audience: campaign.audience,
      type: campaign.type,
      targetId: campaign.targetId,
      actionCategory: campaign.actionCategory,
    });

    await prisma.notificationCampaign.update({
      where: { id: campaign.id },
      data: { sentCount },
    });

    return { ...campaign, sentCount };
  }

  return prisma.notificationCampaign.create({
    data: { ...row, timeToSend: input.timeToSend!, sent: false },
  });
}