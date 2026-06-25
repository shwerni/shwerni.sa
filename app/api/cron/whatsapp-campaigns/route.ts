import { sendWhatsappTemplate, type TemplateParams } from "@/lib/api/whatsapp";
import prisma from "@/lib/database/db";
import { CampaignStatus } from "@/lib/generated/prisma/enums";
import { NextResponse } from "next/server";

export const maxDuration = 60; // requires Vercel Pro plan for >10s; adjust to your plan

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number, spread: number) => base + Math.random() * spread;

async function processCampaign(campaign: {
  id: string;
  phones: string[];
  sentIndex: number;
  ratePerRun: number;
  template: string;
  templateParams: unknown;
  language: string;
  successCount: number;
  failedCount: number;
}) {
  const { id, phones, sentIndex, ratePerRun, template, templateParams, language } = campaign;

  if (sentIndex >= phones.length) {
    await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.COMPLETED },
    });
    return { id, sent: 0, completed: true };
  }

  const batch = phones.slice(sentIndex, sentIndex + ratePerRun);
  let success = 0;
  let failed = 0;

  for (const phone of batch) {
    try {
      const result = await sendWhatsappTemplate(
        phone,
        template,
        templateParams as TemplateParams,
        language,
      );
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`Campaign ${id} failed to send to ${phone}:`, err);
      failed++;
    }

    // pace ourselves between sends, with jitter so it's not a metronome
    await delay(jitter(1200, 500));
  }

  const newSentIndex = sentIndex + batch.length;
  const isDone = newSentIndex >= phones.length;

  await prisma.campaign.update({
    where: { id },
    data: {
      sentIndex: newSentIndex,
      successCount: { increment: success },
      failedCount: { increment: failed },
      status: isDone ? CampaignStatus.COMPLETED : CampaignStatus.ACTIVE,
    },
  });

  return { id, sent: batch.length, success, failed, completed: isDone };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: CampaignStatus.ACTIVE },
    });

    const results = [];
    for (const campaign of activeCampaigns) {
      const result = await processCampaign(campaign);
      results.push(result);
    }

    return NextResponse.json({ ok: true, processed: results });
  } catch (err) {
    console.error("Campaign cron error:", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}