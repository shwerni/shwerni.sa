"use server";

// prisma db
import prisma from "@/lib/database/db";

// packages
import { parseISO } from "date-fns";

// handlers
import { reviewReminder } from "@/handlers/clients/order";

// prisma data
import { checkProgramNextSession } from "./programs";

// lib
import {
  notificationConfirmRescheduling,
  notificationCheckRescheduling,
} from "@/lib/notifications";

// types
import { RescheduleReason, SessionType } from "@/lib/generated/prisma/enums";

// done confirm
export const meetingDone = async (mid: string) => {
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

  // notify rescheduling
  await notificationConfirmRescheduling(meeting.orders, meeting);
};

// checkReschedule
export const checkReschedule = async (mid: string) => {
  // checked to true and get meeting
  const meeting = await prisma.meeting.update({
    where: { mid },
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

  // send whatsapp notification asking if meeting was done
  await notificationCheckRescheduling(meeting.orders, meeting);
};
