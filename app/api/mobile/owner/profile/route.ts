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
import { saveConsultant } from "@/handlers/conusltant/owner/profile";

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
import {
  MOBILE_MIN_COSTS,
  createMobileProfileSchema,
} from "@/schemas/mobile/owner-profile";

// prisma types
import { ApprovalState } from "@/lib/generated/prisma/enums";
import type { Consultant } from "@/lib/generated/prisma/client";

// form rules the app needs before it can validate
interface OwnerProfileMeta {
  certAlwaysRequired: boolean;
  taxRate: number;
  minCosts: typeof MOBILE_MIN_COSTS;
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

  return saveConsultant(
    userId,
    phone,
    {
      name: input.name,
      title: input.title,
      category: input.category,
      gender: input.gender,
      cost30: input.cost30,
      cost45: input.cost45,
      cost60: input.cost60,
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
    const row = await getOwnerProfileRow(user.id);

    return {
      profile: row ? toOwnerProfile(row) : null,
      meta: {
        certAlwaysRequired: certRule(row),
        taxRate: TAX_PERCENT,
        minCosts: MOBILE_MIN_COSTS,
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
