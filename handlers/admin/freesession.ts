"use server";

// Next
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";

// prisma data
import { freeSessionMeetingUrl, reserveFreeSession } from "@/data/freesession";
import {
  checkEventBooking,
  enforceEventLimits,
  type EventBookingReason,
} from "@/data/temp-event";

// schemas
import { freeSessionSchema, freeSessionSchemaType } from "@/schemas";

// lib
import { timeZone } from "@/lib/site/time";
import { userServer } from "@/lib/auth/server";

// utils
import { phoneNumber } from "@/utils";
import { zencryption } from "@/utils/admin/encryption";

// normal free session
export async function confirmFreeSession(data: freeSessionSchemaType) {
  // order
  const order = await reserveFreeSession(data);

  if (order?.state === false || !order?.message) return;

  // create google meeting
  await freeSessionMeetingUrl(Number(order?.message));

  // redirect
  if (order?.message)
    redirect("/freesessions/" + zencryption(Number(order?.message)));
}

// national day — safe arabic messages per failure reason
const EVENT_MESSAGES: Record<EventBookingReason | "INVALID" | "FAILED", string> = {
  OUTSIDE_WINDOW: "عرض اليوم الوطني متاح يوم ٢٣ سبتمبر فقط",
  NOT_IN_EVENT: "هذا المستشار غير مشارك في عرض اليوم الوطني",
  ALREADY_BOOKED: "لقد حجزت جلستك المجانية مسبقًا، العرض متاح مرة واحدة فقط لكل رقم",
  CONSULTANT_FULL: "عذرًا، اكتملت حجوزات هذا المستشار، اختر مستشارًا آخر",
  SLOT_TAKEN: "هذا الموعد تم حجزه للتو، اختر موعدًا آخر",
  INVALID: "الرجاء التحقق من البيانات المدخلة",
  FAILED: "تعذر إتمام الحجز، حاول مرة أخرى",
};

type EventActionResult = { state: false; step: string; message: string };

// national day free session — enrollment, one-per-client, cap, slot and day enforced server-side
export async function confirmEventFreeSession(
  input: freeSessionSchemaType,
): Promise<EventActionResult | void> {
  // never trust the client — re-validate on the server
  const parsed = freeSessionSchema.safeParse(input);
  if (!parsed.success)
    return { state: false, step: "EVENT_INVALID", message: EVENT_MESSAGES.INVALID };

  // identity from the server: session user + normalized phone
  const user = await userServer();
  const author = user?.id ?? "temp";
  const phone = phoneNumber(parsed.data.phone);
  const cid = Number(parsed.data.cid);

  // pre-checks (also confirms today in Riyadh is the event day)
  const blocked = await checkEventBooking(cid, parsed.data.time, phone, author);
  if (blocked)
    return { state: false, step: `EVENT_${blocked}`, message: EVENT_MESSAGES[blocked] };

  // server-computed date, phone and author — nothing identity-related from the client
  const data: freeSessionSchemaType = {
    ...parsed.data,
    phone,
    user: author,
    date: timeZone().iso,
  };

  // create through the normal pipeline (keeps its conflict check + notification)
  const order = await reserveFreeSession(data);
  if (!order || order.state === false)
    return {
      state: false,
      step: "EVENT_RESERVE_FAILED",
      message:
        typeof order?.message === "string" ? order.message : EVENT_MESSAGES.FAILED,
    };

  const fid = Number(order.message);

  // race guard — before creating the meeting
  const lost = await enforceEventLimits(cid, fid, parsed.data.time, phone, author);
  if (lost)
    return { state: false, step: `EVENT_${lost}`, message: EVENT_MESSAGES[lost] };

  // meeting + refresh event lists
  await freeSessionMeetingUrl(fid);
  revalidateTag("event-consultants", "max");

  redirect("/freesessions/" + zencryption(fid));
}