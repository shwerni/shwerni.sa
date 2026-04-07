// utils
import { meetingUrl } from "@/utils";
import { dateToString, meetingLabel } from "@/utils/time";

// prisma types
import { SessionType, UserRole } from "@/lib/generated/prisma/client";

// types
import { Reservation } from "@/types/admin";

// helpers
const wa = (phone: string) => `https://wa.me/${phone}`;

const formatCommonFields = (data: Reservation) => ({
  orderNo: data.oid,
  consultant: data.consultant,
  name: data.name,
  phone: data.phone,
  date: data.meeting?.[0].date,
  time: data.meeting?.[0].time,
  createdAt: data.created_at,
  total: data.payment?.total,
  method: data.payment?.method,
  session: data.session,
  meeting: data.meeting,
});

// templates
export const adminTelegramNewOrder = (data: Reservation) => {
  const { orderNo, date, total } = formatCommonFields(data);

  return [
    `ziad abolmajd`,
    `a new paid order for shwerni`,
    ``,
    `orderNo:  ${orderNo}`,
    `date:     ${date}`,
    `price:    ${total}`,
  ].join("\n");
};

export const serviceTelegramNewOrder = (data: Reservation) => {
  const { orderNo, consultant, phone, name, time, date, createdAt, meeting } =
    formatCommonFields(data);

  // base info (always included)
  const base = [
    `تم حجز و دفع استشارة جديدة على المنصة`,
    ``,
    `رقم الطلب:               ${orderNo}`,
    `المستشار:                ${consultant.name}`,
    `رقم المستشار:            ${consultant.phone}`,
    `تواصل مع المستشار:       ${wa(consultant.phone)}`,
    `اسم العميل:              ${name}`,
    `رقم العميل:              ${phone}`,
    `واتساب العميل:           ${wa(phone)}`,
  ];

  // participants
  const user = meeting?.[0].participants.find(
    (i) => i.role === UserRole.USER,
  )?.participant;
  const owner = meeting?.[0].participants.find(
    (i) => i.role === UserRole.OWNER,
  )?.participant;

  // append meeting details if available
  if (time && date && meeting && user && owner) {
    base.push(
      `رابط الاجتماع للمستشار:  ${meetingUrl(meeting[0].mid, owner)}`,
      `رابط الاجتماع للعميل:    ${meetingUrl(meeting[0].mid, user)}`,
      `موعد الحجز:              ${meetingLabel(time, date)}`,
      `تاريخ الحجز:             ${dateToString(createdAt)}`,
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
  } = formatCommonFields(data);

  // validate
  if (!time || !date) return "";

  return [
    `مستشار يحيى`,
    `تم حجز و دفع استشارة جديدة على منصة شاورني`,
    ``,
    `رقم الطلب:    ${orderNo}`,
    `المستشار:     ${consultant.name}`,
    `اسم العميل:   ${name}`,
    `رقم العميل:   ${phone}`,
    `التكلفة:      ${total}`,
    `طريقة الدفع:  ${method}`,
    `نوع الحجز:    ${session === SessionType.MULTIPLE ? "برنامج" : "جلسة واحدة"}`,
    `موعد الحجز:   ${meetingLabel(time, date)}`,
    `تاريخ الحجز:  ${dateToString(createdAt)}`,
  ].join("\n");
};
