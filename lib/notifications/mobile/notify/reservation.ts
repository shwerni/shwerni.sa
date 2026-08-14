// utils
import { sendNotification } from "@/lib/notifications/mobile/send-notification";
import { Reservation } from "@/types/admin";
import { meetingLabel } from "@/utils/date";
import { meetingDateTime } from "@/utils/time";

// prisma types

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
    description: `حياك الله ${order.name} 🌿، تم تأكيد جلستك مع ${order.consultant.name} بنجاح. الجلسة ${meetingLine}، ونتمنى لك جلسة مفيدة ✨`,
    category: "ORDER_CONFIRMED",
    targetId: String(order.oid),
    actionCategory: "order-confirmed",
  });

  // 2. client — reminder before session
  await sendNotification({
    userId: order.author,
    type: "scheduled",
    title: "🔔 تذكير بجلستك",
    description: `جلستك مع ${order.consultant.name} تبدأ خلال ${REMINDER_MINUTES_BEFORE} دقائق، نتمنى لك حضورًا موفقًا 🌸`,
    category: "SESSION_REMINDER",
    targetId: String(order.oid),
    actionCategory: "reservation-reminder",
    timeToSend: scheduledReminderTime,
  });

  // 3. consultant — instant confirmation
  if (order.consultant.userId) {
    await sendNotification({
      userId: order.consultant.userId,
      type: "instant",
      title: "🔔 حجز جديد",
      description: `أهلاً بك مستشارنا الفاضل ${order.consultant.name} ✨، تم تأكيد حجز جلسة جديدة مع ${order.name}. الجلسة ${meetingLine}، نسأل الله لك التوفيق`,
      category: "NEW_BOOKING",
      targetId: String(order.oid),
    });

    // 4. consultant — reminder before session
    await sendNotification({
      userId: order.consultant.userId,
      type: "scheduled",
      title: "🔔 تذكير بجلستك القادمة",
      description: `جلستك مع ${order.name} تبدأ خلال ${REMINDER_MINUTES_BEFORE} دقائق، نتمنى لك جلسة موفقة 🌿`,
      category: "SESSION_REMINDER",
      targetId: String(order.oid),
      actionCategory: "reservation-reminder",
      timeToSend: scheduledReminderTime,
    });
  }
}