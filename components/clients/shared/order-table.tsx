// React & Next
import React from "react";

// components
import CurrencyLabel from "./currency-label";

// utils
import { cn } from "@/lib/utils";
import { meetingLabel } from "@/utils/date";
import { paymentMethodLabel } from "@/utils";

// icons
import {
  Hash,
  User,
  UserCheck,
  Wallet,
  Clock,
  CreditCard,
  BookOpen,
  Layers,
  CalendarDays,
} from "lucide-react";

// types
import type { MeetingWithOrder, Reservation } from "@/types/admin";

// props
interface Props {
  order: Reservation | MeetingWithOrder;
  session?: number;
}

// narrow between the two shapes
function isMeetingCentric(
  data: Reservation | MeetingWithOrder,
): data is MeetingWithOrder {
  return "orders" in data && "mid" in data;
}

export default function OrderTable({ order: rawData, session }: Props) {
  if (!rawData) return null;

  const FALLBACK = "—";

  // normalize both shapes into one common view
  const order = isMeetingCentric(rawData) ? rawData.orders : rawData;
  const meeting = isMeetingCentric(rawData)
    ? rawData
    : rawData?.meeting?.[session || 0];
  const payment = order?.payment;
  const consultant = order?.consultant;
  const label = meeting ? meetingLabel(meeting?.date, meeting?.time) : null;

  type RowItem = {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
  };

  const rows: RowItem[] = [
    {
      title: "رقم الطلب",
      value: order?.oid || FALLBACK,
      icon: <Hash size={15} />,
    },
    {
      title: "الاسم",
      value: order?.name || FALLBACK,
      icon: <User size={15} />,
    },
    {
      title: "اسم المستشار",
      value: consultant?.name || FALLBACK,
      icon: <UserCheck size={15} />,
    },
    {
      title: "التكلفة",
      value: payment ? (
        <CurrencyLabel
          size="sm"
          amount={payment.total}
          tax={payment.tax}
          textStyle="text-sm"
        />
      ) : (
        FALLBACK
      ),
      icon: <Wallet size={15} />,
    },
    {
      title: "مدة الاستشارة",
      value: meeting?.duration ? `${meeting.duration} دقيقة` : FALLBACK,
      icon: <Clock size={15} />,
    },
  ];

  if (payment?.method) {
    rows.push({
      title: "طريقة الدفع",
      value: paymentMethodLabel(payment.method) || FALLBACK,
      icon: <CreditCard size={15} />,
    });
  }

  if (order?.program?.title) {
    rows.push({
      title: "البرنامج",
      value: order.program.title,
      icon: <BookOpen size={15} />,
    });
  }

  if (order?.sessionCount && order.sessionCount > 1) {
    rows.push({
      title: "عدد الجلسات",
      value: order.sessionCount,
      icon: <Layers size={15} />,
    });
  }

  rows.push({
    title: "ميعاد الاستشارة",
    value: label || FALLBACK,
    icon: <CalendarDays size={15} />,
  });

  return (
    <div className="max-w-3xl w-11/12 p-5 mx-auto border border-border/40  rounded-xl shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
        {rows.map((row, index) => (
          <div
            key={index}
            className={cn(
              index === rows.length - 1 && "sm:col-span-2 flex-col sm:flex-row",
              "flex items-center gap-2.5 py-3 border-b border-border/30 last:border-b-0",
            )}
          >
            <span className="text-muted-foreground/50 shrink-0">
              {row.icon}
            </span>

            <span className="text-xs text-muted-foreground shrink-0">
              {row.title}
            </span>

            <span className="flex-1" />

            <span className="text-sm font-semibold text-foreground truncate">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
