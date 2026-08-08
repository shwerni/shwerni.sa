// utils
import { meetingUrl } from "@/utils";
import { dateToString, meetingLabel } from "@/utils/time";

// prisma types
import { SessionType, UserRole } from "@/lib/generated/prisma/client";

// types
import { Reservation } from "@/types/admin";

// helpers
const wa = (phone: string) => `https://wa.me/${phone}`;

const getBookingTypeLabel = (
  session: SessionType,
  program?: unknown,
  sessionCount?: number,
) => {
  if (session === SessionType.MULTIPLE) {
    const label = program ? "برنامج" : "باقة";
    const countText = sessionCount ? ` (${sessionCount} جلسات)` : "";
    return `${label}${countText}`;
  }
  return "جلسة واحدة";
};

const formatCommonFields = (data: Reservation) => ({
  orderNo: data.oid,
  consultant: data.consultant,
  name: data.name,
  phone: data.phone,
  date: data.meeting?.[0]?.date,
  time: data.meeting?.[0]?.time,
  createdAt: data.created_at,
  total: data.payment?.total,
  method: data.payment?.method,
  session: data.session,
  meeting: data.meeting,
  duration: (data.meeting?.[0]?.duration || "30") + " دقيقة",
  program: data.program,
  sessionCount: data.sessionCount ?? data.program?.sessions,
});

// templates
export const adminTelegramNewOrder = (data: Reservation) => {
  const { orderNo, date, total } = formatCommonFields(data);

  return [
    `<b>ziad abolmajd</b>`,
    `a new paid order for shwerni`,
    ``,
    `<b>orderNo:</b>  ${orderNo}`,
    `<b>date:</b>     ${date}`,
    `<b>price:</b>    ${total}`,
  ].join("\n");
};

export const serviceTelegramNewOrder = (data: Reservation) => {
  const {
    orderNo,
    consultant,
    phone,
    name,
    time,
    date,
    createdAt,
    meeting,
    session,
    program,
    sessionCount,
  } = formatCommonFields(data);

  const bookingType = getBookingTypeLabel(session, program, sessionCount);

  // base info (always included)
  const base = [
    `<b>تم حجز ودفع استشارة جديدة على منصة شاورني</b>`,
    ``,
    `📋 <b>بيانات الطلب:</b>`,
    `• <b>رقم الطلب:</b> #${orderNo}`,
    `• <b>نوع الحجز:</b> ${bookingType}`,
    `• <b>المستشار:</b> ${consultant.name}`,
    `• <b>رقم المستشار:</b> ${consultant.phone}`,
    `• <b>تواصل مع المستشار:</b> <a href="${wa(consultant.phone)}">${wa(consultant.phone)}</a>`,
    `• <b>اسم العميل:</b> ${name}`,
    `• <b>رقم العميل:</b> ${phone}`,
    `• <b>واتساب العميل:</b> <a href="${wa(phone)}">${wa(phone)}</a>`,
  ];

  // participants
  const user = meeting?.[0]?.participants?.find(
    (i) => i.role === UserRole.USER,
  )?.participant;
  const owner = meeting?.[0]?.participants?.find(
    (i) => i.role === UserRole.OWNER,
  )?.participant;

  // append meeting details if available
  if (time && date && meeting?.[0] && user && owner) {
    base.push(
      ``,
      `🗓️ <b>تفاصيل الجلسة:</b>`,
      `• <b>موعد الحجز:</b> ${meetingLabel(time, date)}`,
      `• <b>تاريخ الحجز:</b> ${dateToString(createdAt)}`,
      `• <b>رابط الاجتماع للمستشار:</b> <a href="${meetingUrl(meeting[0].mid, owner)}">${meetingUrl(meeting[0].mid, owner)}</a>`,
      `• <b>رابط الاجتماع للعميل:</b> <a href="${meetingUrl(meeting[0].mid, user)}">${meetingUrl(meeting[0].mid, user)}</a>`,
    );
  }

  return base.join("\n");
};

export const managerTelegramNewOrder = (data: Reservation) => {
  const {
    orderNo,
    consultant,
    name,
    phone,
    total,
    method,
    time,
    date,
    duration,
    createdAt,
    session,
    program,
    sessionCount,
  } = formatCommonFields(data);

  // validate
  if (!time || !date) return "";

  const bookingType = getBookingTypeLabel(session, program, sessionCount);

  return [
    `🌸 <b>مستشار يحيى</b>`,
    `✨ <b>تم حجز ودفع استشارة جديدة على منصة شاورني</b>`,
    ``,
    `📋 <b>بيانات الطلب:</b>`,
    `• <b>رقم الطلب:</b> #${orderNo}`,
    `• <b>المستشار:</b> ${consultant.name}`,
    `• <b>اسم العميل:</b> ${name}`,
    `• <b>رقم العميل:</b> <code>${phone}</code>`,
    `• <b>نوع الحجز:</b> ${bookingType}`,
    `• <b>مدة الجلسة:</b> ${duration}`,
    `• <b>التكلفة:</b> ${total}`,
    `• <b>طريقة الدفع:</b> ${method}`,
    `• <b>موعد الحجز:</b> ${meetingLabel(time, date)}`,
    `• <b>تاريخ الحجز:</b> ${dateToString(createdAt)}`,
  ].join("\n");
};
