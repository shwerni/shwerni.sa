import "server-only";

// utils
import { HttpError } from "@/lib/api/http-error";

// prisma data
import {
  anonymizeAccount,
  canSelfDelete,
  consumeDeletionCode,
  deletionBlockers,
  liveUserIdByPhone,
  sendDeletionCode,
  verifyDeletionCode,
  type DeletionBlocker,
} from "@/data/account-deletion";

// constants
import { DELETION_CODE_TTL_SECONDS } from "@/constants/account";

// the account deletion steps, shared by the app's routes and the website's /account/delete page
// (planned): the user always comes from the caller's session. failures are HttpErrors

const NOT_SELF_SERVICE = "تواصل مع الدعم لإغلاق حساب المستشار";
const BLOCKED = "لا يمكن حذف الحساب الآن";

// a consultant, staff or an already deleted account → 403
async function assertSelfService(userId: string) {
  if (!(await canSelfDelete(userId))) throw new HttpError(NOT_SELF_SERVICE, 403);
}

// any blocker → 409 with the list
async function assertNoBlockers(userId: string) {
  const blockers = await deletionBlockers(userId);
  if (blockers.length > 0) throw new HttpError(BLOCKED, 409, { blockers });
}

// GET account/delete/check
export async function checkAccountDeletion(
  userId: string,
): Promise<{ blockers: DeletionBlocker[] }> {
  await assertSelfService(userId);
  return { blockers: await deletionBlockers(userId) };
}

// POST account/delete/code
export async function requestAccountDeletionCode(
  userId: string,
): Promise<{ sentTo: string; expiresIn: number }> {
  await assertSelfService(userId);
  await assertNoBlockers(userId);

  const sent = await sendDeletionCode(userId);
  if (sent === "rate_limited") throw new HttpError("عدد كبير من المحاولات، حاول لاحقاً", 429);
  if (sent === "no_phone") throw new HttpError("لا يوجد رقم جوال لهذا الحساب، تواصل مع الدعم", 400);
  return { sentTo: sent.sentTo, expiresIn: DELETION_CODE_TTL_SECONDS };
}

// POST account/delete: blockers re-checked before the code is used, so a blocked try keeps the code
export async function deleteAccount(userId: string, code: string): Promise<{ deleted: true }> {
  await assertSelfService(userId);
  await assertNoBlockers(userId);

  if (!(await consumeDeletionCode(userId, code))) {
    throw new HttpError("رمز التحقق غير صحيح أو منتهي الصلاحية", 400);
  }

  await anonymizeAccount(userId);
  console.log(`[account-delete] user=${userId} anonymized`);
  return { deleted: true };
}

// ---------------------------------------------------------------
// the website's signed-out flow (/account/delete): the phone and its code identify the account.
// the code goes to the phone of an existing account only, and the answer is the same either way,
// so the page never tells whether a phone has an account
// ---------------------------------------------------------------

// a deletion code to this phone's account (any role: a consultant then sees the support message)
export async function requestAccountDeletionCodeByPhone(
  phone: string,
): Promise<{ sentTo: string; expiresIn: number }> {
  const answer = { sentTo: `•••• ${phone.slice(-4)}`, expiresIn: DELETION_CODE_TTL_SECONDS };
  const userId = await liveUserIdByPhone(phone);
  if (!userId) return answer;

  const sent = await sendDeletionCode(userId);
  if (sent === "rate_limited") throw new HttpError("عدد كبير من المحاولات، حاول لاحقاً", 429);
  return answer;
}

// the phone's code proves the account: then the same check as signed in (the code stays)
export async function checkAccountDeletionByPhone(
  phone: string,
  code: string,
): Promise<{ selfService: boolean; blockers: DeletionBlocker[] }> {
  const userId = await liveUserIdByPhone(phone);
  if (!userId || !(await verifyDeletionCode(userId, code))) {
    throw new HttpError("رمز التحقق غير صحيح أو منتهي الصلاحية", 400);
  }
  if (!(await canSelfDelete(userId))) return { selfService: false, blockers: [] };
  return { selfService: true, blockers: await deletionBlockers(userId) };
}

// the deletion by the phone and its code (the same deletion as signed in)
export async function deleteAccountByPhone(phone: string, code: string): Promise<{ deleted: true }> {
  const userId = await liveUserIdByPhone(phone);
  if (!userId) throw new HttpError("رمز التحقق غير صحيح أو منتهي الصلاحية", 400);
  return deleteAccount(userId, code);
}
