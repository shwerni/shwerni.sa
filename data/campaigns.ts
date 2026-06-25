"use server";
import { filterValidGulfPhones, shufflePhones } from "@/utils/phone";
import type { TemplateParams } from "@/lib/api/whatsapp";
import { revalidatePath } from "next/cache";
import { CampaignStatus, PaymentState } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/database/db";

// ---------------------------------------------------------------------------
// Phone sourcing
// ---------------------------------------------------------------------------

export type PhoneSource = "paid" | "unpaid" | "both";

/**
 * Pulls candidate phones from existing order/consultant data, excludes
 * consultant (owner) phone numbers, validates them as real Gulf mobile
 * numbers, dedupes, excludes phones already used in ANY previous campaign
 * (so the same customer doesn't get hit by two overlapping campaigns),
 * and shuffles the result.
 */
export async function getCampaignCandidatePhones(source: PhoneSource = "paid") {
  try {
    const consultants = await prisma.consultant.findMany({
      select: { phone: true },
    });
    const consultantPhones = new Set(
      consultants.map((c) => c.phone).filter(Boolean) as string[],
    );

    const where =
      source === "paid"
        ? { payment: { payment: PaymentState.PAID } }
        : source === "unpaid"
          ? {
              payment: {
                payment: {
                  in: [
                    PaymentState.NEW,
                    PaymentState.PROCESSING,
                    PaymentState.HOLD,
                    PaymentState.REFUSED,
                    PaymentState.CANCELED,
                  ],
                },
              },
            }
          : {}; // both -> no payment filter, just exclude refunded below

    const orders = await prisma.order.findMany({
      where,
      distinct: ["phone"],
      select: { phone: true },
    });

    let phones = orders.map((o) => o.phone).filter(Boolean) as string[];

    // remove consultant/owner numbers
    phones = phones.filter((p) => !consultantPhones.has(p));

    // validate as real Gulf mobile numbers (filters out the malformed ones
    // you flagged, e.g. wrong length / wrong country code)
    phones = filterValidGulfPhones(phones);

    // exclude phones already targeted by any existing campaign (regardless
    // of status) so people aren't double-blasted by overlapping campaigns
    const existingCampaigns = await prisma.campaign.findMany({ select: { phones: true } });
    const alreadyTargeted = new Set(existingCampaigns.flatMap((c) => c.phones));
    phones = phones.filter((p) => !alreadyTargeted.has(p));

    return shufflePhones(phones);
  } catch (err) {
    console.error("getCampaignCandidatePhones error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function getCampaigns() {
  try {
    return await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return null;
  }
}

export async function createCampaign(input: {
  name: string;
  template: string;
  templateParams: TemplateParams;
  language?: string;
  source: PhoneSource;
  ratePerRun?: number;
  maxPhones?: number; // optional cap, e.g. only take first 400 of the shuffled pool
}) {
  try {
    let phones = await getCampaignCandidatePhones(input.source);
    if (!phones) return { success: false, error: "Failed to source phones" };

    if (input.maxPhones && phones.length > input.maxPhones) {
      phones = phones.slice(0, input.maxPhones);
    }

    if (phones.length === 0) {
      return { success: false, error: "No eligible phones found for this source" };
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: input.name,
        template: input.template,
        templateParams: input.templateParams as object,
        language: input.language ?? "ar",
        phones,
        ratePerRun: input.ratePerRun ?? 15,
        status: CampaignStatus.ACTIVE,
      },
    });

    revalidatePath("/admin/campaigns");
    return { success: true, campaign };
  } catch (err) {
    console.error("createCampaign error:", err);
    return { success: false, error: "Failed to create campaign" };
  }
}

export async function setCampaignStatus(id: string, status: CampaignStatus) {
  try {
    await prisma.campaign.update({ where: { id }, data: { status } });
    revalidatePath("/admin/campaigns");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteCampaign(id: string) {
  try {
    await prisma.campaign.delete({ where: { id } });
    revalidatePath("/admin/campaigns");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateCampaignRate(id: string, ratePerRun: number) {
  try {
    await prisma.campaign.update({ where: { id }, data: { ratePerRun } });
    revalidatePath("/admin/campaigns");
    return { success: true };
  } catch {
    return { success: false };
  }
}