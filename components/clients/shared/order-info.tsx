// components
import { Separator } from "@/components/ui/separator";
import { PaymentMethod } from "@/lib/generated/prisma/enums";

// types
import { Reservation } from "@/types/admin";
import { findPayment, findPaymentMethod, totalAfterTax } from "@/utils";

// icons
import {
  CalendarDays,
  Clock,
  User,
  CreditCard,
  Hash,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { FaUserDoctor } from "react-icons/fa6";

export default function OrderInfo({
  order,
  session,
}: {
  order: Reservation;
  session?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Order ID strip */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span className="text-xs">رقم الطلب</span>
        </div>
        <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
          {order.id}
        </span>
      </div>

      {/* Details */}
      <div className="px-5 py-1 divide-y divide-border">
        <OrderInfoRow icon={User} label="العميل" value={order.name} />
        <OrderInfoRow icon={Phone} label="الهاتف" value={order.phone} />
        <OrderInfoRow
          icon={FaUserDoctor}
          label="المستشار"
          value={order.consultant.name}
        />
        {order.meeting && (
          <>
            <OrderInfoRow
              icon={CalendarDays}
              label="التاريخ"
              value={order.meeting[session || 0].date}
            />
            <OrderInfoRow
              icon={Clock}
              label="الوقت"
              value={order.meeting[session || 0].time}
            />
            <OrderInfoRow
              icon={Clock}
              label="المدة"
              value={order.meeting[session || 0].duration}
            />
          </>
        )}
      </div>

      <Separator />

      {/* Payment section */}
      {order?.payment && (
        <div className="px-5 py-1 divide-y divide-border">
          <OrderInfoRow
            icon={CreditCard}
            label="طريقة الدفع"
            value={
              findPaymentMethod(
                order.payment.method || PaymentMethod.visaMoyasar,
              )?.label || ""
            }
          />
          <OrderInfoRow
            icon={ShieldCheck}
            label="حالة الدفع"
            value={findPayment(order.payment.payment)?.label || ""}
            accent
          />
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold text-foreground">
              المبلغ الإجمالي
            </span>
            <span className="text-lg font-bold text-primary">
              {totalAfterTax(order.payment.total, 15)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderInfoRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm">{label}</span>
      </div>
      <span
        className={`text-sm font-semibold ${accent ? "text-green-500" : "text-gray-600"}`}
      >
        {value}
      </span>
    </div>
  );
}
