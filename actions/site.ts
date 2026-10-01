"use server";

// hotfix wrappers for public site features: same signatures and return shapes as the server-only originals.
// public by decision; ids that belong to a person come from the session, guests keep each flow's placeholder.

// prisma data
import {
  addArticleComment as addArticleCommentData,
  toggleArticleLike as toggleArticleLikeData,
} from "@/data/article";
import {
  applyCoupon as applyCouponData,
  createConsultantsCoupon as createConsultantsCouponData,
  deleteConsultantsCoupon as deleteConsultantsCouponData,
  getCouponByCode,
} from "@/data/coupon";
import { toggleFavorite as toggleFavoriteData } from "@/data/favorites";
import {
  checkIsAnyConsultantOnline as checkIsAnyConsultantOnlineData,
  getOnlineConsultantsList as getOnlineConsultantsListData,
} from "@/data/online";
import {
  getAvailableTimesForDate as getAvailableTimesForDateData,
  getConsultantsAvailableAt as getConsultantsAvailableAtData,
} from "@/data/reels";
import {
  meetingDone as meetingDoneData,
  rescheduleMeeting as rescheduleMeetingData,
} from "@/data/reschedule";
import { submitScaleResult as submitScaleResultData } from "@/data/scales";
import { selectSession as selectSessionData } from "@/data/sessions";
import {
  acceptNewreview as acceptNewreviewData,
  getReviewsForConsultant as getReviewsForConsultantData,
} from "@/data/review";
import {
  EnrollOnProgram as EnrollOnProgramData,
  createNewProgram as createNewProgramData,
  toggleProgramState as toggleProgramStateData,
} from "@/data/programs";
import {
  createMeetingMessage as createMeetingMessageData,
  getMeetingAccess,
  toggleUserBlock as toggleUserBlockData,
} from "@/data/chats";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { isConsultant, ownConsultantCid, sessionUser } from "@/lib/auth/guards";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// ---------- articles ----------

// logged-in users only; the userId argument is ignored
export async function toggleArticleLike(
  ...[aid]: Parameters<typeof toggleArticleLikeData>
) {
  const user = await sessionUser();
  // same outcome as the original's own errors: the caller's await rejects
  if (!user) throw new Error("unauthorized");
  return toggleArticleLikeData(aid, user.id);
}

// public; author comes from the session, guests post without one
export async function addArticleComment(
  ...[input]: Parameters<typeof addArticleCommentData>
) {
  const user = await sessionUser();
  return addArticleCommentData({ ...input, author: user?.id ?? undefined });
}

// ---------- coupons ----------

// public; the user argument comes from the session, guests are "temp"
export async function applyCoupon(
  ...[, code, cid]: Parameters<typeof applyCouponData>
) {
  // log mode: records the botid verdict, never blocks
  await checkHuman("applyCoupon");
  const user = await sessionUser();
  return applyCouponData(user?.id ?? "temp", code, cid);
}

// own consultant only; the consultantId argument is ignored
export async function createConsultantsCoupon(
  ...[, ...rest]: Parameters<typeof createConsultantsCouponData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return null;
  return createConsultantsCouponData(cid, ...rest);
}

// own consultant only; another consultant's code looks like a failed delete
export async function deleteConsultantsCoupon(
  ...[code]: Parameters<typeof deleteConsultantsCouponData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return null;
  const coupon = await getCouponByCode(code);
  if (!coupon || coupon.consultantId !== cid) return null;
  return deleteConsultantsCouponData(code);
}

// ---------- favorites ----------

// logged-in users only; the userId argument is ignored
export async function toggleFavorite(
  ...[, cid]: Parameters<typeof toggleFavoriteData>
) {
  const user = await sessionUser();
  if (!user) return false;
  return toggleFavoriteData(user.id, cid);
}

// ---------- online consultants ----------

// public
async function checkIsAnyConsultantOnline() {
  return checkIsAnyConsultantOnlineData();
}

// public
export async function getOnlineConsultantsList() {
  return getOnlineConsultantsListData();
}

// ---------- discover (data/reels) ----------

// public
export async function getAvailableTimesForDate(
  ...args: Parameters<typeof getAvailableTimesForDateData>
) {
  return getAvailableTimesForDateData(...args);
}

// public
export async function getConsultantsAvailableAt(
  ...args: Parameters<typeof getConsultantsAvailableAtData>
) {
  return getConsultantsAvailableAtData(...args);
}

// ---------- guest links (public by decision, see docs/progress.md) ----------

// public: /reschedule/[mid]
export async function meetingDone(
  ...args: Parameters<typeof meetingDoneData>
) {
  return meetingDoneData(...args);
}

// public: /reschedule/[mid]
export async function rescheduleMeeting(
  ...args: Parameters<typeof rescheduleMeetingData>
) {
  return rescheduleMeetingData(...args);
}

// public: /scales/orders/[zid]
export async function submitScaleResult(
  ...args: Parameters<typeof submitScaleResultData>
) {
  return submitScaleResultData(...args);
}

// public: /sessions/[id]
export async function selectSession(
  ...args: Parameters<typeof selectSessionData>
) {
  return selectSessionData(...args);
}

// ---------- reviews ----------

// public; author comes from the session, guests are "guest"
export async function acceptNewreview(
  ...[cid, owner, , name, comment, rate]: Parameters<typeof acceptNewreviewData>
) {
  const user = await sessionUser();
  return acceptNewreviewData(cid, owner, user?.id ?? "guest", name, comment, rate);
}

// consultants only
export async function getReviewsForConsultant(
  ...args: Parameters<typeof getReviewsForConsultantData>
) {
  if (!(await isConsultant()))
    return { reviews: [], totalCount: 0, totalPages: 0 };
  return getReviewsForConsultantData(...args);
}

// ---------- programs ----------

// own consultant only; the cid argument is ignored
export async function EnrollOnProgram(
  ...[prid]: Parameters<typeof EnrollOnProgramData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return null;
  return EnrollOnProgramData(prid, cid);
}

// own consultant only; the cid argument is ignored
export async function toggleProgramState(
  ...[prid, , active]: Parameters<typeof toggleProgramStateData>
) {
  const cid = await ownConsultantCid();
  if (!cid) return null;
  return toggleProgramStateData(prid, cid, active);
}

// consultants only
export async function createNewProgram(
  ...args: Parameters<typeof createNewProgramData>
) {
  if (!(await isConsultant())) return null;
  return createNewProgramData(...args);
}

// ---------- chats ----------

// participants only (checked inside by participantId). the sender role always comes from
// that participant record, so a client can't post as the consultant
export async function createMeetingMessage(
  ...[payload]: Parameters<typeof createMeetingMessageData>
) {
  return createMeetingMessageData({ ...payload, sender: undefined });
}

// the meeting's consultant only: either logged in as that consultant, or holding the
// consultant's participant token. participantId is an optional extra argument
export async function toggleUserBlock(
  ...[mid, shouldBlock, participantId]: [
    ...Parameters<typeof toggleUserBlockData>,
    participantId?: string,
  ]
) {
  const access = await getMeetingAccess(mid);
  if (!access) return { error: "Meeting not found" };

  const user = await sessionUser();
  const isMeetingConsultant =
    !!user && access.orders.consultant.userId === user.id;
  const isOwnerParticipant =
    !!participantId &&
    access.participants.some(
      (p) => p.participant === participantId && p.role === UserRole.OWNER,
    );

  // another meeting looks exactly like a missing one
  if (!isMeetingConsultant && !isOwnerParticipant)
    return { error: "Meeting not found" };

  return toggleUserBlockData(mid, shouldBlock);
}
