// utils
import { meetingUrl } from "@/utils";
import { dateToString, meetingLabel } from "@/utils/moment";
// prisma types
import { SessionType, UserRole } from "@/lib/generated/prisma/client";

// types
import { Reservation } from "@/types/admin";

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

export const adminTelegramNewOrder = (data: Reservation) => {
  const { orderNo, date, total } = formatCommonFields(data);
  return `ziad abolmajd
a new paid order for shwerni

orderNo: ${orderNo}
date: ${date}
price: ${total}`;
};

export const serviceTelegramNewOrder = (data: Reservation) => {
  const { orderNo, consultant, phone, name, time, date, createdAt, meeting } =
    formatCommonFields(data);

  // participants
  const user = meeting?.[0].participants.find(
    (i) => i.role === UserRole.USER,
  )?.participant;
  const owner = meeting?.[0].participants.find(
    (i) => i.role === UserRole.OWNER,
  )?.participant;

  // validate
  if (!time || !date || !meeting || !user || !owner)
    return `تم حجز و دفع استشارة جديدة علي المنصة
  
  رقم الطلب: ${orderNo}
  المستشار: ${consultant.name}
  رقم المستشار: ${consultant.phone}
  رابط التواصل مع المستشار: https://wa.me/${consultant.phone}
  اسم العميل: ${name}
  رقم العميل: ${phone}
  رابط الواتس اب: https://wa.me/${phone}`;

  return `تم حجز و دفع استشارة جديدة علي المنصة
  
  رقم الطلب: ${orderNo}
  المستشار: ${consultant.name}
  رقم المستشار: ${consultant.phone}
  رابط التواصل مع المستشار: https://wa.me/${consultant.phone}
  اسم العميل: ${name}
  رقم العميل: ${phone}
  رابط الواتس اب: https://wa.me/${phone}
  رابط الاجتماع للمستشار: ${meetingUrl(meeting[0].mid, owner)}
  رابط الاجتماع للعميل: ${meetingUrl(meeting[0].mid, user)}
  موعد الحجز: ${meetingLabel(time, date)}
  التاريخ الحجز: ${dateToString(createdAt)}`;
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

  return `مستشار يحيي
  تم حجز و دفع استشارة جديدة علي منصة شاورني
  
  رقم الطلب: ${orderNo}
  المستشار: ${consultant.name}
اسم العميل: ${name}
رقم العميل: ${phone}
التكلفة: ${total}
طريقة الدفع: ${method}
نوع الحجز: ${session === SessionType.MULTIPLE ? "برنامج" : "جلسة واحدة"}
موعد الحجز: ${meetingLabel(time, date)}
تاريخ الحجز: ${dateToString(createdAt)}`;
};
