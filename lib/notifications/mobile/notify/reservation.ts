// utils
import { sendNotification } from "@/lib/notifications/mobile/send-notification";
import { Reservation } from "@/types/admin";
import { meetingDateTime, meetingLabel } from "@/utils/date";
import { OrderType } from "@/lib/generated/prisma/enums";

const REMINDER_MINUTES_BEFORE = 5;

/**
 * all four order-confirmation notifications: an instant + reminder pair
 * for the client, and an instant + reminder pair for the consultant
 */
export async function mobileNotifyOrderConfirmed(order: Reservation) {
  const meeting = order.meeting?.[0];
  if (!meeting) return;

  const sessionStart = meetingDateTime(meeting.date, meeting.time);
  const reminderAt = new Date(
    sessionStart.getTime() - REMINDER_MINUTES_BEFORE * 60_000,
  );
  const now = new Date();
  const scheduledReminderTime = reminderAt > now ? reminderAt : sessionStart;
  const meetingLine = meetingLabel(meeting.date, meeting.time);

  // 1. client — instant confirmation
  await sendNotification({
    userId: order.author,
    type: "instant",
    title: "🔔 تم تأكيد حجزك",
    description: `حياك الله ${order.name} 🌿، تم تأكيد جلستك مع المستشار ${order.consultant.name} بنجاح. رقم الطلب #${order.oid}، الجلسة ${meetingLine}، ونتمنى لك جلسة مفيدة ✨`,
    category: "ORDER_CONFIRMED",
    targetId: String(order.oid),
    actionCategory: "order-confirmed",
  });

  // 2. client — reminder before session. not for an INSTANT order: its start has already passed
  // the reminder time, so it would fire at once
  if (order.type !== OrderType.INSTANT) {
    await sendNotification({
      userId: order.author,
      type: "scheduled",
      title: "🔔 تذكير بجلستك",
      description: `جلستك مع المستشار ${order.consultant.name} تبدأ خلال ${REMINDER_MINUTES_BEFORE} دقائق، رقم الطلب #${order.oid}، نتمنى لك حضورًا موفقًا 🌸`,
      category: "SESSION_REMINDER",
      targetId: String(order.oid),
      actionCategory: "reservation-reminder",
      timeToSend: scheduledReminderTime,
    });
  }

  // 3. consultant — instant confirmation. not for an INSTANT order: the consultant gets its own
  // ring + INSTANT_BOOKED push (notify/instant.ts), and a reminder at an already-passed start
  // would fire at once
  if (order.consultant.userId && order.type !== OrderType.INSTANT) {
    await sendNotification({
      userId: order.consultant.userId,
      type: "instant",
      title: "🔔 حجز جديد",
      description: `أهلاً بك مستشارنا الفاضل ${order.consultant.name} ✨، تم تأكيد حجز جلسة جديدة مع العميل ${order.name}. رقم الطلب #${order.oid}، الجلسة ${meetingLine}، نسأل الله لك التوفيق`,
      category: "NEW_BOOKING",
      targetId: String(order.oid),
    });

    // 4. consultant — reminder before session
    await sendNotification({
      userId: order.consultant.userId,
      type: "scheduled",
      title: "🔔 تذكير بجلستك القادمة",
      description: `جلستك مع العميل ${order.name} تبدأ خلال ${REMINDER_MINUTES_BEFORE} دقائق، رقم الطلب #${order.oid}، نتمنى لك جلسة موفقة 🌿`,
      category: "SESSION_REMINDER",
      targetId: String(order.oid),
      actionCategory: "reservation-reminder",
      timeToSend: scheduledReminderTime,
    });
  }
}