import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// packages
import { parseISO } from "date-fns";

// handlers
import { reviewReminder } from "@/handlers/clients/order";

// prisma data
import { checkProgramNextSession } from "./programs";
import { changedFields, writeMeetingLog } from "./meeting-log";
import { lockConsultantBookings } from "./booking/lock";
import { isBookableSlot } from "./booking/slots";
import { checkMeetingTimeConflict } from "./order/reserveation";

// lib
import {
  notificationConfirmRescheduling,
  notificationCheckRescheduling,
} from "@/lib/notifications/site";

// types
import {
  MeetingLogAction,
  PaymentState,
  RescheduleReason,
  SessionType,
} from "@/lib/generated/prisma/enums";
import type { DbTx } from "@/lib/database/tx";

// who did it, for the meeting log: a logged-in consultant; none for the client's link or whatsapp
export type MeetingActor = { id: string; name?: string | null; role?: string | null };

/**
 * what the reschedule and done checks read about a meeting: its time, done, the order's phone and
 * payment state (no tokens)
 * @param mid the meeting
 */
export const getMeetingGate = (mid: string) =>
  prisma.meeting.findUnique({
    where: { mid },
    select: {
      date: true,
      time: true,
      done: true,
      orders: { select: { phone: true, payment: { select: { payment: true } } } },
    },
  });

// done confirm (the caller checked who may: handlers/meetings/reschedule.ts)
export const meetingDone = async (mid: string, actor?: MeetingActor) => {
  // state before, for the meeting log
  const previous = await prisma.meeting.findUnique({
    where: { mid },
    select: { done: true, checked: true },
  });

  // update meeting to done and checked
  const meeting = await prisma.meeting.update({
    where: { mid },
    data: {
      checked: true,
      done: true,
    },
    include: {
      orders: true,
    },
  });

  // validate
  if (!meeting) return;

  // meeting log: DONE when done flipped, CHECKED when checked flipped (the client's link or the
  // whatsapp button: no actor; a logged-in consultant: him). it never throws
  if (previous && !previous.done)
    await writeMeetingLog({
      meetingId: mid,
      orderId: meeting.orderId,
      session: meeting.session,
      action: "DONE",
      source: "SITE",
      ...(actor ? { actor } : {}),
      before: { done: false },
      after: { done: true },
    });
  if (previous && !previous.checked)
    await writeMeetingLog({
      meetingId: mid,
      orderId: meeting.orderId,
      session: meeting.session,
      action: "CHECKED",
      source: "SITE",
      ...(actor ? { actor } : {}),
      before: { checked: false },
      after: { checked: true },
    });

  // review reminder (the first time only: a second "done" changes nothing)
  if (previous && !previous.done)
    await reviewReminder(meeting.orderId, meeting.session);

  // session selection (if program)
  if (previous && !previous.done && meeting.orders.session !== SessionType.MULTIPLE)
    await checkProgramNextSession(meeting.orderId, meeting.session ?? 1);

  // return
  return true;
};

/**
 * may this meeting be rescheduled (again)? the first reschedule is free; each "copy reschedule
 * link" from the dashboard (a RESCHEDULE_LINK_ISSUED meeting log) grants one more, as its link's
 * limit (reschedules so far + 1) did. read from the database: the link's limit and reason are
 * ignored (they can be edited by anyone)
 * @param count reschedules so far
 * @param lastReschedule the latest one's time
 * @param lastGrant the latest dashboard link's time
 * @returns allowed, and staffGranted: the allowance comes from a staff link (reason MANAGEMENT)
 */
export const rescheduleAllowance = (
  count: number,
  lastReschedule: Date | null,
  lastGrant: Date | null,
) => {
  const staffGranted = !!lastGrant && (!lastReschedule || lastGrant > lastReschedule);
  return { allowed: count === 0 || staffGranted, staffGranted };
};

/**
 * rescheduleAllowance for a meeting, from its reschedule rows and the dashboard's link logs
 * @param mid the meeting
 * @param db the reschedule's transaction, when inside one
 */
export const getRescheduleAllowance = async (
  mid: string,
  db: DbTx | typeof prisma = prisma,
) => {
  const count = await db.reschedule.count({ where: { meetingId: mid } });
  const last = await db.reschedule.findFirst({
    where: { meetingId: mid },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const grant = await db.meetingLog.findFirst({
    where: { meetingId: mid, action: MeetingLogAction.RESCHEDULE_LINK_ISSUED },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return rescheduleAllowance(count, last?.createdAt ?? null, grant?.createdAt ?? null);
};

export type RescheduleWrite =
  | {
      ok: true;
      before: { date: string; time: string; duration: string; checked: boolean };
      meeting: { orderId: number; session: number };
    }
  | { ok: false; code: "gone" | "not_allowed" | "slot_taken" };

/**
 * moves a paid meeting to a new slot by the booking's rules: under the consultant's booking lock
 * (lockConsultantBookings), the state is read again (paid, not done, the allowance and the
 * reason), the slot must be bookable (isBookableSlot: one of the consultant's weekly timings in
 * the booking window, free) and conflict-free (checkMeetingTimeConflict), the meeting's own row
 * excluded; then the reschedule row and the new date / time (checked reset) in one transaction.
 * the duration stays the meeting's own. the caller checked who may, and that the session started
 * @param mid the meeting
 * @param date yyyy-MM-dd (riyadh)
 * @param time HH:mm
 * @param reason MANAGEMENT only with a staff link's allowance
 */
export const rescheduleMeetingLocked = async (
  mid: string,
  date: string,
  time: string,
  reason: RescheduleReason,
): Promise<RescheduleWrite> =>
  prisma.$transaction(async (tx) => {
    // the consultant never changes; lock on him first, then read everything else
    const owner = await tx.meeting.findUnique({
      where: { mid },
      select: { orders: { select: { consultantId: true } } },
    });
    if (!owner) return { ok: false, code: "gone" } as const;
    const cid = owner.orders.consultantId;
    await lockConsultantBookings(tx, cid);

    const meeting = await tx.meeting.findUnique({
      where: { mid },
      select: {
        orderId: true,
        session: true,
        date: true,
        time: true,
        duration: true,
        done: true,
        checked: true,
        orders: { select: { payment: { select: { payment: true } } } },
      },
    });
    if (!meeting) return { ok: false, code: "gone" } as const;
    if (meeting.orders.payment?.payment !== PaymentState.PAID || meeting.done)
      return { ok: false, code: "not_allowed" } as const;

    const allowance = await getRescheduleAllowance(mid, tx);
    if (!allowance.allowed) return { ok: false, code: "not_allowed" } as const;
    if (reason === RescheduleReason.MANAGEMENT && !allowance.staffGranted)
      return { ok: false, code: "not_allowed" } as const;

    // the booking's slot rules, the moved meeting itself excluded
    if (!(await isBookableSlot(cid, date, time, [], tx, mid)))
      return { ok: false, code: "slot_taken" } as const;
    if (await checkMeetingTimeConflict(cid, time, date, undefined, tx, mid))
      return { ok: false, code: "slot_taken" } as const;

    // create rescheduling
    await tx.reschedule.create({
      data: {
        orderId: meeting.orderId,
        reason,
        meetingId: mid,
        oldDate: parseISO(`${meeting.date}T${meeting.time}:00`),
        newDate: parseISO(`${date}T${time}:00`),
      },
    });

    // update meeting
    await tx.meeting.update({
      where: { mid },
      data: { date, time, checked: false },
    });

    return {
      ok: true,
      before: {
        date: meeting.date,
        time: meeting.time,
        duration: meeting.duration,
        checked: meeting.checked,
      },
      meeting: { orderId: meeting.orderId, session: meeting.session },
    } as const;
  });

/**
 * after a reschedule committed: the meeting log line, then the confirmation to both sides with
 * the NEW date and time (it used to send the meeting as read before the update: the old time)
 * @param mid the meeting
 * @param write the committed reschedule
 * @param date the new date
 * @param time the new time
 * @param actor the logged-in consultant, if he did it
 */
export const afterReschedule = async (
  mid: string,
  write: Extract<RescheduleWrite, { ok: true }>,
  date: string,
  time: string,
  actor?: MeetingActor,
) => {
  // meeting log: the customer's reschedule link (no actor) or the consultant (logged in). it never
  // throws. before and after always hold date, time and duration, even when only one of them
  // changed, so the shift the meeting was in can be read from the line itself (the dashboard's
  // SHIFTS.md §6.1); checked only when it changed
  const checked = changedFields({ checked: write.before.checked }, { checked: false });
  await writeMeetingLog({
    meetingId: mid,
    orderId: write.meeting.orderId,
    session: write.meeting.session,
    action: "RESCHEDULED",
    source: "SITE",
    ...(actor ? { actor } : {}),
    before: {
      date: write.before.date,
      time: write.before.time,
      duration: write.before.duration,
      ...checked.before,
    },
    after: { date, time, duration: write.before.duration, ...checked.after },
  });

  // notify rescheduling, with the meeting as it is now
  const meeting = await prisma.meeting.findUnique({
    where: { mid },
    include: {
      orders: {
        include: {
          consultant: { select: { name: true, phone: true } },
        },
      },
    },
  });
  if (meeting?.orders) await notificationConfirmRescheduling(meeting.orders, meeting);
};

// checkReschedule
export const checkReschedule = async (mid: string) => {
  // state before, for the meeting log
  const previous = await prisma.meeting.findUnique({
    where: { mid },
    select: { checked: true },
  });

  // checked to true and get meeting
  const meeting = await prisma.meeting.update({
    where: { mid, orders: { payment: { payment: PaymentState.PAID } } },
    data: { checked: true },
    include: {
      orders: {
        include: {
          consultant: { select: { name: true, phone: true } },
        },
      },
    },
  });

  // validate
  if (!meeting || !meeting.orders) return;

  // meeting log: the reschedule cron flagged it (system). it never throws
  if (previous && !previous.checked)
    await writeMeetingLog({
      meetingId: mid,
      orderId: meeting.orderId,
      session: meeting.session,
      action: "CHECKED",
      source: "SYSTEM",
      before: { checked: false },
      after: { checked: true },
    });

  // send whatsapp notification asking if meeting was done
  await notificationCheckRescheduling(meeting.orders, meeting);
};
