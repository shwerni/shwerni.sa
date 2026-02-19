// components

// utils
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
import type { Reservation } from "@/types/admin";
import React from "react";
import CurrencyLabel from "./currency-label";
import { cn } from "@/lib/utils";

// props
interface Props {
  order: Reservation;
}

export default function OrderTable({ order }: Props) {
  // meeting
  const meeting = order.meeting;

  // payment
  const payment = order.payment;

  // validate
  if (!meeting || !payment) return null;

  const firstMeeting = meeting[0];

  // label
  const label = meetingLabel(firstMeeting?.date, firstMeeting?.time);

  type RowItem = {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
  };

  const rows: RowItem[] = [
    {
      title: "رقم الطلب",
      value: order?.oid,
      icon: <Hash size={15} />,
    },
    {
      title: "الاسم",
      value: order?.name,
      icon: <User size={15} />,
    },
    {
      title: "اسم المستشار",
      value: order.consultant.name,
      icon: <UserCheck size={15} />,
    },
    {
      title: "التكلفة",
      value: (
        <CurrencyLabel
          size="sm"
          amount={payment.total}
          tax={payment.tax}
          textStyle="text-sm"
        />
      ),
      icon: <Wallet size={15} />,
    },
    {
      title: "مدة الاستشارة",
      value: `${firstMeeting?.duration} دقيقة`,
      icon: <Clock size={15} />,
    },
  ];

  if (payment?.method) {
    rows.push({
      title: "طريقة الدفع",
      value: paymentMethodLabel(payment.method),
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

  if (order?.sessionCount > 1) {
    rows.push({
      title: "عدد الجلسات",
      value: order.sessionCount,
      icon: <Layers size={15} />,
    });
  }

  rows.push({
    title: "ميعاد الاستشارة",
    value: label,
    icon: <CalendarDays size={15} />,
  });

  // return
  return (
    <div className="max-w-3xl w-11/12 p-5 mx-auto border border-border/40  rounded-xl shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
        {rows.map((row, index) => (
          <div
            key={index}
            className={cn(index === rows.length - 1 && "sm:col-span-2 flex-col sm:flex-row","flex items-center gap-2.5 py-3 border-b border-border/30 last:border-b-0")}
          >
            {/* icon */}
            <span className="text-muted-foreground/50 shrink-0">{row.icon}</span>

            {/* title */}
            <span className="text-xs text-muted-foreground shrink-0">
              {row.title}
            </span>

            {/* spacer */}
            <span className="flex-1" />

            {/* value */}
            <span className="text-sm font-semibold text-foreground truncate">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
