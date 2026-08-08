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
  sessionCount?: number
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
    `🎉 <b>تم حجز ودفع استشارة جديدة على منصة شاورني</b>`,
    ``,
    `📋 <b>بيانات الطلب:</b>`,
    `• <b>رقم الطلب:</b> #${orderNo}`,
    `• <b>نوع الحجز:</b> ${bookingType}`,
    `• <b>المستشار:</b> ${consultant.name}`,
    `• <b>رقم المستشار:</b> <code>${consultant.phone}</code>`,
    `• <a href="${wa(consultant.phone)}">📱 تواصل مع المستشار عبر واتساب</a>`,
    `• <b>اسم العميل:</b> ${name}`,
    `• <b>رقم العميل:</b> <code>${phone}</code>`,
    `• <a href="${wa(phone)}">📱 تواصل مع العميل عبر واتساب</a>`,
  ];

  // participants
  const user = meeting?.[0]?.participants?.find(
    (i) => i.role === UserRole.USER
  )?.participant;
  const owner = meeting?.[0]?.participants?.find(
    (i) => i.role === UserRole.OWNER
  )?.participant;

  // append meeting details if available
  if (time && date && meeting?.[0] && user && owner) {
    base.push(
      ``,
      `🗓️ <b>تفاصيل الجلسة:</b>`,
      `• <b>موعد الحجز:</b> ${meetingLabel(time, date)}`,
      `• <b>تاريخ الحجز:</b> ${dateToString(createdAt)}`,
      `• <a href="${meetingUrl(meeting[0].mid, owner)}">🔗 رابط الاجتماع للمستشار</a>`,
      `• <a href="${meetingUrl(meeting[0].mid, user)}">🔗 رابط الاجتماع للعميل</a>`
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
    `• <b>التكلفة:</b> ${total}`,
    `• <b>طريقة الدفع:</b> ${method}`,
    `• <b>موعد الحجز:</b> ${meetingLabel(time, date)}`,
    `• <b>تاريخ الحجز:</b> ${dateToString(createdAt)}`,
  ].join("\n");
};