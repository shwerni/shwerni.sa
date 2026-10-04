"use server";

// hotfix wrappers: same signatures and return shapes as the server-only originals

// prisma data
import { getConsultantAvailableTimes as getConsultantAvailableTimesData } from "@/data/consultant";
import { confirmOathAcceptance as confirmOathAcceptanceData } from "@/data/admin/tools/oath";
import { getDuesOwnenByMonth as getDuesOwnenByMonthData } from "@/data/dues";
import {
  saveConsultant as saveConsultantHandler,
  ownerVisibility as ownerVisibilityHandler,
} from "@/handlers/conusltant/owner/profile";
import { saveBankAccount as saveBankAccountHandler } from "@/handlers/conusltant/owner/bank-account";
import {
  updateConsultantBaseCosts as updateConsultantBaseCostsData,
  upsertConsultantPackage as upsertConsultantPackageData,
} from "@/data/packages";
import { updateConsultantSpecialties as updateConsultantSpecialtiesData } from "@/data/specialties";
import {
  getTimings as getTimingsData,
  updateTimings as updateTimingsData,
} from "@/data/timings";
import {
  saveUploadedFile as saveUploadedFileData,
  saveUploadedImage as saveUploadedImageData,
} from "@/data/uploads";
import { toggleFreesessionState as toggleFreesessionStateData } from "@/data/freesession";
import { toggleDiscountState as toggleDiscountStateData } from "@/data/discounts";

// lib
import { isConsultant, ownConsultantCid, sessionUser } from "@/lib/auth/guards";

// public: open slots for a consultant
export async function getConsultantAvailableTimes(
  ...args: Parameters<typeof getConsultantAvailableTimesData>
) {
  return getConsultantAvailableTimesData(...args);
}

// session user only; the userId argument is ignored
export async function confirmOathAcceptance(
  ..._args: Parameters<typeof confirmOathAcceptanceData>
) {
  const user = await sessionUser();
  if (!user) return null;
  return confirmOathAcceptanceData(user.id);
}

// own consultant only; the cid argument is ignored
export async function getDuesOwnenByMonth(
  ...[range]: Parameters<typeof getDuesOwnenByMonthData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return null;
  return getDuesOwnenByMonthData(range, cid);
}

// session user only; author and phone come from the session
export async function saveConsultant(
  ...[, , ...rest]: Parameters<typeof saveConsultantHandler>
): ReturnType<typeof saveConsultantHandler> {
  const user = await sessionUser();
  if (!user || !user.phone) return { state: false, message: "بيانات خاطئة" };
  return saveConsultantHandler(user.id, user.phone, ...rest);
}

// session user only; the author argument is ignored
export async function ownerVisibility(
  ...[, state]: Parameters<typeof ownerVisibilityHandler>
) {
  const user = await sessionUser();
  if (!user)
    return { state: false, message: "حدث حطأ ما برجاء المحاولة مرة اخري" };
  return ownerVisibilityHandler(user.id, state);
}

// the handler reads the session itself
export async function saveBankAccount(
  ...args: Parameters<typeof saveBankAccountHandler>
) {
  return saveBankAccountHandler(...args);
}

// own consultant only; the cid argument is ignored
export async function updateConsultantBaseCosts(
  ...[, cost30, cost45, cost60]: Parameters<typeof updateConsultantBaseCostsData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return { success: false };
  return updateConsultantBaseCostsData(cid, cost30, cost45, cost60);
}

// own consultant only; the consultantId argument is ignored
export async function upsertConsultantPackage(
  ...[, count, cost, isActive]: Parameters<typeof upsertConsultantPackageData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return { success: false };
  return upsertConsultantPackageData(cid, count, cost, isActive);
}

// own consultant only; the cid argument is ignored
export async function updateConsultantSpecialties(
  ...[, selectedIds]: Parameters<typeof updateConsultantSpecialtiesData>
) {
  const cid = await ownConsultantCid();
  // same outcome as a failed write: the caller's await rejects
  if (!cid) throw new Error("forbidden");
  return updateConsultantSpecialtiesData(cid, selectedIds);
}

// own consultant only; userId and consultantId come from the session
export async function updateTimings(
  ...[, , day, times, type]: Parameters<typeof updateTimingsData>
) {
  const user = await sessionUser();
  const cid = await ownConsultantCid();
  if (!user || !cid) return null;
  return updateTimingsData(user.id, cid, day, times, type);
}

// own consultant only; userId and consultantId come from the session
export async function getTimings(
  ...[, , day]: Parameters<typeof getTimingsData>
) {
  const user = await sessionUser();
  const cid = await ownConsultantCid();
  if (!user || !cid) return null;
  return getTimingsData(user.id, cid, day);
}

// consultants only
export async function saveUploadedImage(
  ...args: Parameters<typeof saveUploadedImageData>
) {
  if (!(await isConsultant())) return null;
  return saveUploadedImageData(...args);
}

// consultants only
export async function saveUploadedFile(
  ...args: Parameters<typeof saveUploadedFileData>
) {
  if (!(await isConsultant())) return null;
  return saveUploadedFileData(...args);
}

// own consultant only; the cid argument is ignored
export async function toggleFreesessionState(
  ...[, status]: Parameters<typeof toggleFreesessionStateData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return null;
  return toggleFreesessionStateData(cid, status);
}

// own consultant only; the cid argument is ignored
export async function toggleDiscountState(
  ...[did, status]: Parameters<typeof toggleDiscountStateData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return null;
  return toggleDiscountStateData(did, status, cid);
}
