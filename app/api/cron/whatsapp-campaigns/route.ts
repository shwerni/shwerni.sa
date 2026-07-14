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

  // Campaign done — send yourself the exact template clients got (once),
  // then mark completed.
  if (sentIndex >= phones.length) {
    const testResult = await sendWhatsappTemplate(
      ADMIN_PHONE,
      template,
      templateParams as TemplateParams,
      language,
      isMarketing,
    );

    await telegramAdmin(
      `✅ اكتملت الحملة: "${name}"\n` +
      `القالب: ${template} | ${phones.length} رقم\n` +
      `نسخة القالب إليك: ${testResult.ok ? "✅ أُرسلت" : `❌ ${testResult.errorMessage}${testResult.errorCode ? ` (code ${testResult.errorCode})` : ""}${testResult.httpStatus ? ` [HTTP ${testResult.httpStatus}]` : ""}`}\n` +
      `المعاملات: ${JSON.stringify(templateParams, null, 2)}`,
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

  // Telegram batch progress (no WhatsApp spam per batch)
  await telegramAdmin(
    `🚀 دفعة "${name}": ✅ ${success} / ❌ ${failed} | ${newSentIndex}/${phones.length}`,
  ).catch(() => {});

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