import "server-only";

// packages
import { randomUUID } from "node:crypto";

// React & Next
import { after } from "next/server";

// lib
import { dispatchIncomingCall } from "@/lib/api/room/dispatch";
import { consultantBusyPayload } from "@/lib/api/realtime/consultant-busy";
import { sendNotification } from "@/lib/notifications/mobile/send-notification";

// utils
import { timeLabel } from "@/utils/date";

// types
import type { Reservation } from "@/types/admin";

// the website's instant notice (components/consultant/instant/booked-notice.tsx)
const TITLE = "🔔 لديك جلسة فورية الآن";

/**
 * tell the consultant's app about a paid instant session: a voip ring (an incoming call, like the
 * room rings: serverCallId = the meeting id, the client as the caller) and, always alongside it
 * (decided by Ziad), an INSTANT_BOOKED push (targetId = the meeting id) for devices the ring
 * can't reach. nothing for a center consultant (no user) or a meeting that has already ended.
 * every failure is logged and never thrown
 * @param order the paid instant order, with its consultant and meeting (as onPaymentSuccess has it)
 */
export async function notifyInstantBooked(order: Reservation): Promise<void> {
  const payload = consultantBusyPayload(order);
  if (!payload) return;

  const meeting = order.meeting?.[0];
  const startsAt = meeting ? timeLabel(meeting.time) : "";

  const [ring, push] = await Promise.allSettled([
    dispatchIncomingCall(payload.consultantId, {
      eventId: randomUUID(),
      serverCallId: payload.meetingId,
      hasVideo: false,
      startedAt: new Date().toISOString(),
      caller: { id: order.author, displayName: order.name },
    }),
    sendNotification({
      userId: payload.consultantId,
      type: "instant",
      title: TITLE,
      description: `تبدأ الجلسة الساعة ${startsAt}`,
      category: "INSTANT_BOOKED",
      targetId: payload.meetingId,
    }),
  ]);

  if (ring.status === "rejected") {
    console.error(`[instant] oid=${order.oid} voip ring failed`, ring.reason);
  }
  if (push.status === "rejected") {
    console.error(`[instant] oid=${order.oid} INSTANT_BOOKED push failed`, push.reason);
  }
}

// after the response (next's after(), like scheduleConsultantBusy), so it never delays the payment;
// outside a request scope it runs in the background. never throws into the caller
export function scheduleInstantBooked(order: Reservation): void {
  const task = () => notifyInstantBooked(order).catch(() => {});
  try {
    after(task);
  } catch {
    void task();
  }
}
