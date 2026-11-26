"use server";

// hotfix wrappers for public site features: same signatures and return shapes as the server-only originals.
// public by decision; ids that belong to a person come from the session, guests keep each flow's placeholder.

// prisma data
import {
  addArticleComment as addArticleCommentData,
  toggleArticleLike as toggleArticleLikeData,
} from "@/data/article";
import {
  createConsultantsCoupon as createConsultantsCouponData,
  deleteConsultantsCoupon as deleteConsultantsCouponData,
  getCouponByCode,
} from "@/data/coupon";
import { toggleFavorite as toggleFavoriteData } from "@/data/favorites";
import { getOnlineConsultantsList as getOnlineConsultantsListData } from "@/data/online";
import {
  getAvailableTimesForDate as getAvailableTimesForDateData,
  getConsultantsAvailableAt as getConsultantsAvailableAtData,
} from "@/data/reels";
import { submitScaleResult as submitScaleResultData } from "@/data/scales";
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
import { markChatRead as markChatReadData } from "@/data/chat-read";

// handlers
import { quoteBooking } from "@/handlers/admin/order/booking-quote";
import { pickNextSession } from "@/handlers/clients/package-session";
import { chatSide } from "@/handlers/meetings/meeting-access";
import { markDoneViaLink, rescheduleViaLink } from "@/handlers/meetings/reschedule";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { isConsultant, ownConsultantCid, sessionUser } from "@/lib/auth/guards";
import { getRealtimeOnlineIds } from "@/lib/api/realtime/internal";
import { ONLINE_LIST_TTL_MS } from "@/lib/api/realtime/online-list-timing";
import { sharedTtl } from "@/lib/shared-ttl";

// prisma types
import { RescheduleReason, UserRole } from "@/lib/generated/prisma/enums";

// utils
import { COUPON_MESSAGES } from "@/utils/coupon";

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
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("addArticleComment"))) return { success: false };
  const user = await sessionUser();
  return addArticleCommentData({ ...input, author: user?.id ?? undefined });
}

// ---------- coupons ----------

// the booking the coupon form previews against (the client's choices; Pay checks them again)
export type CouponPreviewBooking = {
  order: "consultant" | "instant";
  cid: number;
  duration?: number | string | null;
  package?: string | null;
};

export type CouponPreviewResult =
  | { state: true; discount: number; code: string; message: string }
  | { state: false; message: string };

// public; the user comes from the session, guests are "temp". the preview runs Pay's own pricing
// (quoteBooking, not strict) with the coupon, so the form shows exactly what Pay will charge
export async function applyCoupon(
  code: string,
  booking: CouponPreviewBooking,
): Promise<CouponPreviewResult> {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("applyCoupon"))) return { state: false, message: COUPON_MESSAGES.not_found };
  const user = await sessionUser();

  const quote = await quoteBooking({
    order: booking.order,
    cid: booking.cid,
    duration: booking.duration,
    package: booking.package,
    couponCode: code,
    user: user?.id ?? "temp",
  });
  if (!quote.state) return { state: false, message: quote.message };
  if (!quote.coupon)
    return { state: false, message: quote.couponError ?? COUPON_MESSAGES.not_found };

  return {
    state: true,
    discount: quote.coupon.percent,
    code: quote.coupon.code,
    message: "تم تطبيق الخصم",
  };
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

// the live ids come from the realtime server (server-side, behind the internal secret).
// unreachable: an empty list, since no consultant can be online without it
async function loadOnlineConsultantsList() {
  let onlineIds: string[];
  try {
    onlineIds = await getRealtimeOnlineIds();
  } catch (err) {
    console.error("[online] realtime presence unavailable:", err);
    return [];
  }
  return getOnlineConsultantsListData(onlineIds);
}

// every visitor on this instance shares one list for ONLINE_LIST_TTL_MS (one database query and
// one realtime call however many visitors, or bots, ask), see lib/api/realtime/online-list-timing.ts
const sharedOnlineConsultantsList = sharedTtl(
  loadOnlineConsultantsList,
  ONLINE_LIST_TTL_MS,
);

// public
export async function getOnlineConsultantsList() {
  return sharedOnlineConsultantsList();
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

// public: /reschedule/[mid]. the client's own link token (no login), or the consultant's login and
// ownership; a raw mid is refused (handlers/meetings/reschedule.ts)
export async function meetingDone(mid: string, token: string | null) {
  return markDoneViaLink(mid, token);
}

// public: /reschedule/[mid]. the same access; the booking's slot rules under the consultant's lock
export async function rescheduleMeeting(
  mid: string,
  token: string | null,
  date: string,
  time: string,
  reason: RescheduleReason,
) {
  return rescheduleViaLink(mid, token, date, time, reason);
}

// public: /scales/orders/[zid]
export async function submitScaleResult(
  ...args: Parameters<typeof submitScaleResultData>
) {
  return submitScaleResultData(...args);
}

// public: /sessions/[id]. the link is the access (clients never log in); the session number,
// the duration and the slot rules are all decided on the server (handlers/clients/package-session.ts),
// so any session or duration sent by the browser is ignored
export async function selectSession(oid: number, time: string, date: string) {
  return pickNextSession(Number(oid), { date, time });
}

// ---------- reviews ----------

// public; author comes from the session, guests are "guest"
export async function acceptNewreview(
  ...[cid, owner, , name, comment, rate]: Parameters<typeof acceptNewreviewData>
) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("acceptNewreview"))) return null;
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

// participants only: a client by their own token (no login); the consultant's token only with
// his login on this order (chatSide). the sender role always comes from that participant record,
// so a client can't post as the consultant
export async function createMeetingMessage(
  ...[payload]: Parameters<typeof createMeetingMessageData>
) {
  if (!(await chatSide(payload?.mid, payload?.participantId, "createMeetingMessage"))) {
    return { error: "Meeting not found" };
  }

  // nonce is the app's (its routes check it); the website never sends one
  return createMeetingMessageData({ ...payload, sender: undefined, nonce: undefined });
}

// participants only (checked by participantId): the chat page marks its side read up to the newest
// message it shows. the side comes from that participant record (clientReadAt or ownerReadAt), the
// same read state the app uses; it only moves forward and never past now
export async function markMeetingChatRead(
  mid: string,
  participantId: string,
  until: string,
) {
  if (typeof mid !== "string" || typeof participantId !== "string" || typeof until !== "string") {
    return null;
  }
  const untilDate = new Date(until);
  if (!Number.isFinite(untilDate.getTime())) return null;

  // the client's token alone, or the consultant's with his login (chatSide)
  const reader = await chatSide(mid, participantId, "markMeetingChatRead");
  if (!reader) return null;

  const readAt = await markChatReadData(mid, reader, untilDate);
  return readAt ? readAt.toISOString() : null;
}

// the meeting's consultant only, by his login on this order. a consultant with no account (a
// center consultant) keeps his token (chatSide, logged). participantId is an optional extra
// argument; it never stands in for the login (the data function's third argument, the log actor,
// comes from the session here and is not part of what the client can send)
export async function toggleUserBlock(
  ...[mid, shouldBlock, participantId]: [
    mid: string,
    shouldBlock: boolean,
    participantId?: string,
  ]
) {
  const access = await getMeetingAccess(mid);
  if (!access) return { error: "Meeting not found" };

  const user = await sessionUser();
  const isMeetingConsultant =
    !!user && access.orders.consultant.userId === user.id;
  const isAccountlessOwner =
    !access.orders.consultant.userId &&
    !!participantId &&
    (await chatSide(mid, participantId, "toggleUserBlock")) === UserRole.OWNER;

  // another meeting looks exactly like a missing one
  if (!isMeetingConsultant && !isAccountlessOwner)
    return { error: "Meeting not found" };

  // the meeting log's actor is the session consultant (none for an accountless consultant)
  const actor = isMeetingConsultant
    ? { id: user.id, name: user.name, role: user.role }
    : null;

  return toggleUserBlockData(mid, shouldBlock, actor);
}
