import prisma from "@/lib/database/db";
import { NextResponse } from "next/server";
import { CampaignStatus } from "@/lib/generated/prisma/enums";
import {
  sendWhatsappTemplate,
  type TemplateParams,
} from "@/lib/api/whatsapp";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

export const maxDuration = 60;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number, spread: number) => base + Math.random() * spread;

const MAX_ERROR_LOG_ENTRIES = 30;
const ADMIN_PHONE = "201222166530";

type ErrorLogEntry = {
  phone: string;
  httpStatus?: number;
  errorCode?: number;
  errorMessage: string;
  at: string;
};

async function sendCompletionNotice(
  name: string,
  template: string,
  templateParams: unknown,
  language: string,
  isMarketing: boolean,
  totalPhones: number,
  totalSuccess: number,
  totalFailed: number,
) {
  const testResult = await sendWhatsappTemplate(
    ADMIN_PHONE,
    template,
    templateParams as TemplateParams,
    language,
    isMarketing,
  );

  const templateStatus = testResult.ok
    ? "✅ أُرسل القالب إليك"
    : `❌ فشل إرسال القالب: ${testResult.errorMessage}` +
      (testResult.errorCode ? ` (code ${testResult.errorCode})` : "") +
      (testResult.httpStatus ? ` [HTTP ${testResult.httpStatus}]` : "");

  await telegramAdmin(
    `✅ اكتملت الحملة: "${name}"\n` +
    `القالب: ${template} | ${totalPhones} رقم\n` +
    `النتيجة: ✅ ${totalSuccess} / ❌ ${totalFailed}\n` +
    `${templateStatus}\n` +
    `المعاملات: ${JSON.stringify(templateParams, null, 2)}`,
  ).catch(() => {});
}

async function processCampaign(campaign: {
  id: string;
  name: string;
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
    name,
    phones,
    sentIndex,
    ratePerRun,
    template,
    templateParams,
    language,
    category,
  } = campaign;
  const isMarketing = category === "MARKETING";

  // This branch only hits if a campaign was somehow left in ACTIVE state
  // after already being fully sent (e.g. a previous DB update failed).
  // Guard kept for safety but completion notice is now triggered below
  // at the end of the batch that crosses the finish line.
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

    await delay(jitter(1200, 500));
  }

  const newSentIndex = sentIndex + batch.length;
  const isDone = newSentIndex >= phones.length;

  const existingErrors = Array.isArray(campaign.lastErrors)
    ? (campaign.lastErrors as ErrorLogEntry[])
    : [];
  const mergedErrors = [...newErrors, ...existingErrors].slice(0, MAX_ERROR_LOG_ENTRIES);

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

  if (isDone) {
    // Fire completion notice in the same run as the finishing batch —
    // the next cron tick won't see this campaign (status=COMPLETED,
    // filtered out by the ACTIVE query), so this is the only chance.
    await sendCompletionNotice(
      name,
      template,
      templateParams,
      language,
      isMarketing,
      phones.length,
      campaign.successCount + success,
      campaign.failedCount + failed,
    );
  } else {
    // Batch progress to Telegram only (no WhatsApp spam mid-campaign)
    await telegramAdmin(
      `🚀 دفعة "${name}": ✅ ${success} / ❌ ${failed} | ${newSentIndex}/${phones.length}`,
    ).catch(() => {});
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