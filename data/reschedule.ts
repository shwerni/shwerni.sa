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

// lib
import {
  notificationConfirmRescheduling,
  notificationCheckRescheduling,
} from "@/lib/notifications/site";

// types
import {
  PaymentState,
  RescheduleReason,
  SessionType,
} from "@/lib/generated/prisma/enums";

// done confirm
export const meetingDone = async (mid: string) => {
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

  // meeting log: DONE when done flipped, CHECKED when checked flipped (public link or
  // whatsapp button, so no actor). it never throws
  if (previous && !previous.done)
    await writeMeetingLog({
      meetingId: mid,
      orderId: meeting.orderId,
      session: meeting.session,
      action: "DONE",
      source: "SITE",
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
      before: { checked: false },
      after: { checked: true },
    });

  // review reminder
  await reviewReminder(meeting.orderId, meeting.session);

  // session selection (if program)
  if (meeting.orders.session !== SessionType.MULTIPLE)
    await checkProgramNextSession(meeting.orderId, meeting.session ?? 1);

  // return
  return true;
};

// rescheduleMeeting
export const rescheduleMeeting = async (
  mid: string,
  date: string,
  time: string,
  reason: RescheduleReason,
) => {
  // get meeting
  const meeting = await prisma.meeting.findUnique({
    where: {
      mid,
    },
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

  // create rescheduling
  await prisma.reschedule.create({
    data: {
      orderId: meeting.orderId,
      reason,
      meetingId: mid,
      oldDate: parseISO(`${meeting.date}T${meeting.time}:00`),
      newDate: parseISO(`${date}T${time}:00`),
    },
  });

  // update meeting
  await prisma.meeting.update({
    where: {
      mid,
    },
    data: {
      date,
      time,
      checked: false,
    },
  });

  // meeting log: the customer's reschedule link (no actor). it never throws. before and after
  // always hold date, time and duration, even when only one of them changed, so the shift the
  // meeting was in can be read from the line itself (the dashboard's SHIFTS.md §6.1); checked
  // only when it changed
  const checked = changedFields({ checked: meeting.checked }, { checked: false });
  await writeMeetingLog({
    meetingId: mid,
    orderId: meeting.orderId,
    session: meeting.session,
    action: "RESCHEDULED",
    source: "SITE",
    before: {
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      ...checked.before,
    },
    after: { date, time, duration: meeting.duration, ...checked.after },
  });

  // notify rescheduling
  await notificationConfirmRescheduling(meeting.orders, meeting);
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

// is rescheduled before
export const isRescheduled = async (mid: string, limit: number = 1) => {
  // create rescheduling
  const rescheduledCount = await prisma.reschedule.count({
    where: {
      meetingId: mid,
    },
  });
  
  return rescheduledCount >= limit;
};
