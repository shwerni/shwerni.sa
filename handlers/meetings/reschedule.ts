import "server-only";

// packages
import { z } from "zod";

// handlers
import { meetingViewer, type MeetingViewer } from "@/handlers/meetings/meeting-access";

// lib
import { userServer } from "@/lib/auth/server";
import { checkHuman } from "@/lib/bot-protection";

// prisma data
import {
  afterReschedule,
  getMeetingGate,
  meetingDone,
  rescheduleMeetingLocked,
  type MeetingActor,
} from "@/data/reschedule";
import { isMeetingNeedsReschedule } from "@/data/meetings";
import { ensureMeetingParticipant } from "@/data/rooms";

// prisma types
import { PaymentState, RescheduleReason, UserRole } from "@/lib/generated/prisma/enums";

// utils
import { samePhone } from "@/utils";
import { timeZone } from "@/utils/date";
import { baseActionErrors } from "@/utils/action-errors";

// constants
import { mainRoute } from "@/constants/links";

// the words shown to the client (the page's toasts)
export const RESCHEDULE_MESSAGES = {
  link_invalid:
    "انتهت صلاحية هذا الرابط، اضغط زر إعادة الجدولة في رسالة واتساب مرة أخرى للحصول على رابط جديد",
  not_started: "موعد الجلسة لم يحن بعد",
  not_allowed: "لا يمكن إعادة جدولة هذه الجلسة",
  slot_taken: "هذا الموعد لم يعد متاحاً، برجاء اختيار موعد آخر",
  invalid_input: "برجاء اختيار موعد صحيح",
  done_not_allowed: "لا يمكن تعليم هذه الجلسة كمنتهية",
  bot_detected: baseActionErrors.bot_detected,
  server_error: baseActionErrors.server_error,
} as const;

export type RescheduleCode = keyof typeof RESCHEDULE_MESSAGES;
export type LinkActionResult = { ok: true } | { ok: false; code: RescheduleCode; message: string };

const fail = (code: RescheduleCode): LinkActionResult => ({
  ok: false,
  code,
  message: RESCHEDULE_MESSAGES[code],
});

const rescheduleInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.nativeEnum(RescheduleReason),
});

/**
 * has a meeting's start passed, in riyadh time? (the page's rule: a session can be rescheduled or
 * marked done once its time came; the browser's clock no longer decides)
 * @param date the meeting's yyyy-MM-dd
 * @param time the meeting's HH:mm
 */
export const hasMeetingStarted = (date: string, time: string) => {
  const now = timeZone();
  return `${now.date} ${now.time}` >= `${date} ${time}`;
};

/**
 * who opens a reschedule link, by the standing rule (CLAUDE.md): the client with their own USER
 * token for this meeting (no login); the consultant with his login and ownership of the order
 * (no token, or an OWNER token with his session). a raw mid, another meeting's token or no
 * session is refused (null)
 * @param mid the meeting, from the link
 * @param token the link's participant token, if any
 */
export async function rescheduleViewer(mid: unknown, token: unknown): Promise<MeetingViewer | null> {
  if (typeof mid !== "string" || !mid) return null;
  const t = typeof token === "string" && token ? token : null;
  const viewer = await meetingViewer(mid, t, "reschedule");
  return viewer && viewer !== "login" ? viewer : null;
}

// the meeting log's actor: a logged-in consultant (an accountless one has none)
async function actorOf(viewer: MeetingViewer): Promise<MeetingActor | undefined> {
  if (viewer.side !== "consultant") return undefined;
  const user = await userServer();
  return user?.id ? { id: user.id, name: user.name, role: user.role } : undefined;
}

/**
 * the reschedule link's "confirm": the viewer (rescheduleViewer), the session's start passed, then
 * rescheduleMeetingLocked (paid, not done, the allowance, the reason, the booking's slot rules,
 * under the consultant's booking lock); after the commit the log and the confirmation
 * @returns ok, or a code and its message. never a token or a meeting row
 */
export async function rescheduleViaLink(
  mid: unknown,
  token: unknown,
  date: unknown,
  time: unknown,
  reason: unknown,
): Promise<LinkActionResult> {
  if (!(await checkHuman("reschedule-meeting"))) return fail("bot_detected");

  const parsed = rescheduleInput.safeParse({ date, time, reason });
  if (!parsed.success) return fail("invalid_input");

  const viewer = await rescheduleViewer(mid, token);
  if (!viewer) return fail("link_invalid");
  const meetingId = mid as string;

  try {
    const gate = await getMeetingGate(meetingId);
    if (!gate) return fail("link_invalid");
    if (!hasMeetingStarted(gate.date, gate.time)) return fail("not_started");

    const write = await rescheduleMeetingLocked(
      meetingId,
      parsed.data.date,
      parsed.data.time,
      parsed.data.reason,
    );
    if (!write.ok) return fail(write.code === "gone" ? "link_invalid" : write.code);

    await afterReschedule(meetingId, write, parsed.data.date, parsed.data.time, await actorOf(viewer));
    return { ok: true };
  } catch (error) {
    console.error("[reschedule] failed", error);
    return fail("server_error");
  }
}

/**
 * the reschedule page's "the session happened": the same viewer rule, a paid order, the start
 * passed. already done: nothing changes, ok
 */
export async function markDoneViaLink(mid: unknown, token: unknown): Promise<LinkActionResult> {
  if (!(await checkHuman("meeting-done"))) return fail("bot_detected");

  const viewer = await rescheduleViewer(mid, token);
  if (!viewer) return fail("link_invalid");
  const meetingId = mid as string;

  try {
    const gate = await getMeetingGate(meetingId);
    if (!gate) return fail("link_invalid");
    if (gate.orders.payment?.payment !== PaymentState.PAID) return fail("done_not_allowed");
    if (!hasMeetingStarted(gate.date, gate.time)) return fail("not_started");
    if (gate.done) return { ok: true };

    await meetingDone(meetingId, await actorOf(viewer));
    return { ok: true };
  } catch (error) {
    console.error("[meeting-done] failed", error);
    return fail("server_error");
  }
}

/**
 * the whatsapp "the session happened" button (check_session, sent to the order's phone): only
 * from the order's own number, a paid order whose start passed. the webhook isn't signed yet
 * (backlog: X-Hub-Signature-256), so the sender is checked here
 * @param mid the button's meeting
 * @param from the sender's whatsapp number
 */
export async function markDoneFromWhatsapp(mid: string, from: string): Promise<void> {
  const gate = await getMeetingGate(mid);
  if (!gate) return;
  if (!samePhone(from, gate.orders.phone)) {
    console.warn(`[whatsapp] meeting-done for mid=${mid} from a number that isn't the order's`);
    return;
  }
  if (gate.orders.payment?.payment !== PaymentState.PAID) return;
  if (!hasMeetingStarted(gate.date, gate.time) || gate.done) return;
  await meetingDone(mid);
}

/**
 * the whatsapp "reschedule" button's reply: the link with the client's own token (the link is
 * their access), only to the order's own number, for a meeting that is over and not done
 * @param mid the button's meeting
 * @param from the sender's whatsapp number
 * @returns the order id and the link, or null (nothing is sent)
 */
export async function rescheduleLinkForWhatsapp(
  mid: string,
  from: string,
): Promise<{ orderId: number; url: string } | null> {
  const meeting = await isMeetingNeedsReschedule(mid);
  if (!meeting) return null;
  if (!samePhone(from, meeting.orders.phone)) {
    console.warn(`[whatsapp] rescheduling for mid=${mid} from a number that isn't the order's`);
    return null;
  }
  const token =
    meeting.participants[0]?.participant ?? (await ensureMeetingParticipant(mid, UserRole.USER));
  return {
    orderId: meeting.orderId,
    url: `${mainRoute}reschedule/${mid}?participant=${encodeURIComponent(token)}`,
  };
}
