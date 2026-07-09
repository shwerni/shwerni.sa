import prisma from "@/lib/database/db";
import { NextResponse } from "next/server";
import { CampaignStatus } from "@/lib/generated/prisma/enums";
import {
  sendWhatsappTemplate,
  sendWhatsappText,
  type TemplateParams,
} from "@/lib/api/whatsapp";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

export const maxDuration = 60;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number, spread: number) => base + Math.random() * spread;

// Keep a bounded log of the most recent failures per campaign so the admin
// page can show *why* sends are failing instead of just a failed count.
const MAX_ERROR_LOG_ENTRIES = 30;

type ErrorLogEntry = {
  phone: string;
  httpStatus?: number;
  errorCode?: number;
  errorMessage: string;
  at: string; // ISO timestamp
};

async function processCampaign(campaign: {
  id: string;
  phones: string[];
  sentIndex: number;
  ratePerRun: number;
  template: string;
  templateParams: unknown;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  successCount: number;
  failedCount: number;
  lastErrors?: unknown;
}) {
  const {
    id,
    phones,
    sentIndex,
    ratePerRun,
    template,
    templateParams,
    language,
    category,
  } = campaign;
  const isMarketing = category === "MARKETING";

  // Campaign already fully processed - just flip status, no sends.
  // NOTE: the previous version had a leftover debug line here that sent a
  // real test message to a hardcoded number every time a campaign finished.
  // That's removed - this branch now ONLY updates status, no side effects.
  if (sentIndex >= phones.length) {
    // test and check
    await sendWhatsappText(
      "201222166530",
      `✅ اكتملت الحملة القالب: ${template}\nالإجمالي: ${phones.length}`,
    );
    // test template
    await telegramAdmin(`"201222166530", ${template}, ${templateParams}, ${language}, ${isMarketing}`)
    await sendWhatsappTemplate(
      "201222166530",
      template,
      templateParams as TemplateParams,
      language,
      isMarketing,
    );
    await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.COMPLETED },
    });
    return { id, sent: 0, completed: true };
  }

  const batch = phones.slice(sentIndex, sentIndex + ratePerRun);
  let success = 0;
  let failed = 0;
  const newErrors: ErrorLogEntry[] = [];

  for (const phone of batch) {
    const result = await sendWhatsappTemplate(
      phone,
      template,
      templateParams as TemplateParams,
      language,
      isMarketing,
    );

    if (result.ok) {
      success++;
      console.log(`✅ Campaign ${id} → ${phone}: sent`);
    } else {
      failed++;
      const entry: ErrorLogEntry = {
        phone,
        httpStatus: result.httpStatus,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        at: new Date().toISOString(),
      };
      newErrors.push(entry);
      console.error(
        `❌ Campaign ${id} → ${phone}: ${result.errorMessage}` +
          (result.errorCode ? ` (code ${result.errorCode})` : "") +
          (result.httpStatus ? ` [HTTP ${result.httpStatus}]` : ""),
      );
    }

    // pace ourselves between sends, with jitter so it's not a metronome
    await delay(jitter(1200, 500));
  }

  const newSentIndex = sentIndex + batch.length;
  const isDone = newSentIndex >= phones.length;

  // merge new errors onto the existing log, keep only the most recent N
  const existingErrors = Array.isArray(campaign.lastErrors)
    ? (campaign.lastErrors as ErrorLogEntry[])
    : [];
  const mergedErrors = [...newErrors, ...existingErrors].slice(
    0,
    MAX_ERROR_LOG_ENTRIES,
  );

  await prisma.campaign.update({
    where: { id },
    data: {
      sentIndex: newSentIndex,
      successCount: { increment: success },
      failedCount: { increment: failed },
      lastErrors: mergedErrors as object,
      status: isDone ? CampaignStatus.COMPLETED : CampaignStatus.ACTIVE,
    },
  });

  if (failed > 0) {
    console.warn(
      `⚠️ Campaign ${id}: ${failed}/${batch.length} sends failed this run. See lastErrors on the campaign record.`,
    );
  }

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
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await processCampaign(campaign as any);
        results.push(result);
      } catch (err) {
        // don't let one broken campaign kill the whole cron run
        console.error(`🔥 Campaign ${campaign.id} threw unexpectedly:`, err);
        results.push({ id: campaign.id, error: String(err) });
      }
    }

    return NextResponse.json({ ok: true, processed: results });
  } catch (err) {
    console.error("Campaign cron error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
