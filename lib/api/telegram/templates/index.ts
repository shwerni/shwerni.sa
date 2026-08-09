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
    `🔔 <b>تم حجز ودفع استشارة جديدة على منصة شاورني</b>`,
    ``,
    `📋 <b>بيانات الطلب:</b>`,
    `• <b>رقم الطلب:</b> #${orderNo}`,
    `• <b>نوع الحجز:</b> ${bookingType}`,
    `• <b>المستشار:</b> ${consultant.name}`,
    `• <b>رقم المستشار:</b> ${consultant.phone}`,
    `• <a href="${wa(consultant.phone)}">📱 تواصل مع المستشار عبر واتساب</a>`,
    `${wa(consultant.phone)}`,
    `• <b>اسم العميل:</b> ${name}`,
    `• <b>رقم العميل:</b> ${phone}`,
    `• <a href="${wa(phone)}">📱 تواصل مع العميل عبر واتساب</a>`,
    `${wa(phone)}`,
  ];

  // participants
  const user = meeting?.[0]?.participants?.find(
    (i) => i.role === UserRole.USER,
  )?.participant;
  const owner = meeting?.[0]?.participants?.find(
    (i) => i.role === UserRole.OWNER,
  )?.participant;

  // append meeting details if available
  // Build the meeting details block dynamically
  const meetingDetails: string[] = [];

  // 1. Add booking time if both time and date exist
  if (time && date) {
    meetingDetails.push(`• <b>موعد الحجز:</b> ${meetingLabel(time, date)}`);
  }

  // 2. Add creation date if it exists
  if (createdAt) {
    meetingDetails.push(`• <b>تاريخ الحجز:</b> ${dateToString(createdAt)}`);
  }

  // 3. Add meeting links individually if the meeting ID and respective tokens exist
  if (meeting?.[0]?.mid) {
    if (owner) {
      meetingDetails.push(
        `• <a href="${meetingUrl(meeting[0].mid, owner)}">🔗 رابط الاجتماع للمستشار</a>`,
      );
    }
    if (user) {
      meetingDetails.push(
        `• <a href="${meetingUrl(meeting[0].mid, user)}">🔗 رابط الاجتماع للعميل</a>`,
      );
    }
  }

  // Append the block to the message only if there is at least one detail to show
  if (meetingDetails.length > 0) {
    base.push(``, `🗓️ <b>تفاصيل الجلسة:</b>`, ...meetingDetails);
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
