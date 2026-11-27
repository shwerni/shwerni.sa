// packages
import type { NextRequest } from "next/server";

// utils
import { TAX_PERCENT } from "@/utils/tax";
import { HttpError } from "@/lib/api/http-error";
import { requireMobileOwner } from "@/lib/auth/require-approved-owner";
import {
  createGetRoute,
  createPatchRoute,
  createPostRoute,
} from "@/lib/api/routes/route-factory";

// handlers
import {
  saveConsultant,
  saveConsultantKeepVisibility,
} from "@/handlers/conusltant/owner/profile";

// data
import { getOwnerApprovalByUser } from "@/data/consultant";
import {
  getOwnerPhone,
  getOwnerProfileRow,
  ownerRowExists,
  ownsUploads,
  toOwnerProfile,
  type OwnerProfile,
  type OwnerProfileRow,
} from "@/data/mobile/owner-profile";

// schemas
import { isCertAlwaysRequired, yearsToDate } from "@/schemas/consultant/profile";
import { createMobileProfileSchema, mobileCosts } from "@/schemas/mobile/owner-profile";

// pricing
import { getPricingSettings } from "@/data/admin/settings/pricing";
import { durationLabel, effectiveDurations, minimumFor, readCosts } from "@/utils/pricing";
import { PACKAGE_SESSION_MINUTES } from "@/constants/pricing";

// prisma types
import { ApprovalState } from "@/lib/generated/prisma/enums";
import type { Consultant } from "@/lib/generated/prisma/client";

// the pricing rules for the form: the catalog (each length's minimum, maximum and label), the
// consultant's own lengths (the price fields), the package session length and their stored prices
interface OwnerPricingMeta {
  catalog: { minutes: number; min: number; max?: number; label: string }[];
  durations: number[];
  packageMinutes: number;
  costs: Record<string, number>;
}

// form rules the app needs before it can validate
interface OwnerProfileMeta {
  certAlwaysRequired: boolean;
  taxRate: number;
  // the 30 / 45 / 60 minimums (from the pricing settings), the shape the app reads today
  minCosts: { cost30: number; cost45: number; cost60: number };
  pricing: OwnerPricingMeta;
}

interface OwnerProfileResponse {
  profile: OwnerProfile | null;
  meta: OwnerProfileMeta;
}

interface OwnerProfileSaveResponse {
  approval: ApprovalState;
  cid: number;
}

/**
 * license rule for this owner: the website helper only reads created_at
 * @param row the owner's row, null before creation
 */
const certRule = (row: OwnerProfileRow | null) =>
  isCertAlwaysRequired(row as Consultant | null);

/**
 * validate the body, check file ownership and save through the website's handler, so
 * blocked checks, commission, review state and the reviewer notification stay identical
 * @param request incoming request
 * @param userId session user id
 * @param row the owner's current row, null on create
 */
async function save(
  request: NextRequest,
  userId: string,
  row: OwnerProfileRow | null,
) {
  const body = await request.json().catch(() => null);
  const parsed = createMobileProfileSchema(certRule(row)).safeParse(body);
  if (!parsed.success) {
    throw new HttpError(parsed.error.issues[0]?.message ?? "بيانات خاطئة", 400);
  }
  const input = parsed.data;

  const owned = await ownsUploads(
    userId,
    row,
    [input.image],
    [input.cv, input.edu, input.cert],
  );
  if (!owned) throw new HttpError("ملف غير صالح، يرجى رفعه مرة أخرى", 400);

  const phone = await getOwnerPhone(userId);
  if (!phone) throw new HttpError("يرجى إضافة رقم الجوال إلى حسابك أولاً", 400);

  // PATCH without bank keeps the stored account (it must be complete to be reused)
  const stored = row?.bankAccount;
  const bank =
    input.bank ??
    (stored?.holderName
      ? { holderName: stored.holderName, iban: stored.iban }
      : null);
  if (!bank) throw new HttpError("يرجى إدخال بيانات الحساب البنكي", 400);

  // an edit keeps the consultant's own visibility switch; unlike the website, saving doesn't
  // make a hidden profile visible again. creating is the website's save as is
  const handler = row ? saveConsultantKeepVisibility : saveConsultant;

  return handler(
    userId,
    phone,
    {
      name: input.name,
      title: input.title,
      category: input.category,
      gender: input.gender,
      // costs or the legacy cost30/45/60, as one map; the handler checks his own lengths only
      costs: mobileCosts(input),
      nabout: input.nabout,
      neducation: input.neducation,
      nexperiences: input.nexperiences,
      preference: input.preference,
    },
    input.image,
    input.cv,
    input.edu,
    input.cert,
    input.nabout,
    input.nexperiences,
    input.neducation,
    input.preference,
    yearsToDate(input.years).toISOString(),
    bank,
  );
}

// the owner's own profile for the form, null before it's created
export const GET = createGetRoute<OwnerProfileResponse>(
  async (request: NextRequest) => {
    const user = await requireMobileOwner(request);
    const [row, settings] = await Promise.all([
      getOwnerProfileRow(user.id),
      getPricingSettings(),
    ]);

    const durations = effectiveDurations(settings, row?.durations);
    const costs = row ? readCosts(row) : {};

    return {
      profile: row ? toOwnerProfile(row) : null,
      meta: {
        certAlwaysRequired: certRule(row),
        taxRate: TAX_PERCENT,
        minCosts: {
          cost30: minimumFor(settings, 30) ?? 0,
          cost45: minimumFor(settings, 45) ?? 0,
          cost60: minimumFor(settings, 60) ?? 0,
        },
        pricing: {
          catalog: settings.catalog.map((entry) => ({
            minutes: entry.minutes,
            min: entry.min,
            ...(entry.max !== undefined && { max: entry.max }),
            label: durationLabel(entry.minutes),
          })),
          durations,
          packageMinutes: PACKAGE_SESSION_MINUTES,
          costs: Object.fromEntries(
            durations
              .filter((minutes) => typeof costs[String(minutes)] === "number")
              .map((minutes) => [String(minutes), costs[String(minutes)]]),
          ),
        },
      },
    };
  },
  { errorMessage: "failed to fetch" },
);

// create the consultant profile + bank account; one per user, review starts as PENDING
export const POST = createPostRoute<OwnerProfileSaveResponse>(
  async (request: NextRequest) => {
    const user = await requireMobileOwner(request);

    if (await ownerRowExists(user.id)) {
      throw new HttpError("لديك ملف مستشار بالفعل", 409);
    }

    const result = await save(request, user.id, null);

    // the handler can fail after its transaction (reviewer notification): the row decides
    const created = await getOwnerApprovalByUser(user.id);
    if (created) return { approval: created.approved, cid: created.cid };

    throw new HttpError(result.message, 400);
  },
  { errorMessage: "failed to save" },
);

// update the profile (and the bank when sent); not allowed once rejected
export const PATCH = createPatchRoute<OwnerProfileSaveResponse>(
  async (request: NextRequest) => {
    const user = await requireMobileOwner(request);
    const row = await getOwnerProfileRow(user.id);

    if (!row) throw new HttpError("لم يتم إنشاء ملفك بعد", 404);
    if (row.approved === ApprovalState.REJECTED) {
      throw new HttpError("لا يمكن تعديل الملف بعد رفضه، تواصل مع الدعم", 403);
    }

    const result = await save(request, user.id, row);
    if (!result.state || !result.consultant) {
      throw new HttpError(result.message, 400);
    }

    return { approval: result.consultant.approved, cid: result.consultant.cid };
  },
  { errorMessage: "failed to save" },
);
