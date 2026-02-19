"use client";
import React from "react";

// components
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import { Separator } from "@/components/ui/separator";

// utils
import { dateToString } from "@/utils/moment";
import { calculateDues } from "@/utils/admin/dues";

// prisma types
import { CouponType } from "@/lib/generated/prisma/enums";

// types
import { Reservation } from "@/types/admin";
import { Badge } from "@/components/ui/badge";

// props
interface Props {
  children: React.JSX.Element;
  order: Reservation;
  commission: number | undefined;
}

function OrderItem(props: { label: string; value: string | number }) {
  return (
    <div>
      <div className="flex justify-between w-11/12">
        <h3 className="text-sm">{props.label}</h3>
        <h3 className="text-sm">{props.value}</h3>
      </div>
      <Separator className="w-1/2 my-3 mx-auto" />
    </div>
  );
}

export default function DuesDialog({ children, order, commission }: Props) {
  const meeting = order.meeting;
  const payment = order.payment;

  if (meeting && payment && commission)
    return (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className="w-11/12 bg-zblue-100 max-w-96 rounded"
          dir="rtl"
        >
          <div className="space-y-5">
            {/* Title */}
            <h3 className="w-fit mx-auto">
              {order.name}
              <span className="text-zblue-200"> #{order.oid}</span>
            </h3>

            {/* Basic info */}
            <div>
              <OrderItem label="رقم الطلب" value={order.oid} />
              <OrderItem label="اسم العميل" value={order.name} />
              <OrderItem
                label="تاريخ الحجز"
                value={dateToString(order.created_at)}
              />
              <OrderItem
                label="الإجمالي"
                value={`${payment.total.toFixed(2)} sar`}
              />
            </div>

            {/* Detailed dues calculation */}
            <div className="space-y-2">
              {payment.usedCoupon ? (
                <div className="flex flex-col gap-1 space-y-3">
                  <h3 className="text-base text-zblue-200">تفاصيل الخصم</h3>
                  <div className="inline-flex gap-2">
                    <h3 className="text-sm">نوع الكوبون:</h3>
                    <Badge className="text-sm bg-slate-200 text-black">
                      {payment.usedCoupon.type === CouponType.GENERAL
                        ? "عام"
                        : payment.usedCoupon.type === CouponType.CONSULTANT
                          ? "خاص بالمستشار"
                          : payment.usedCoupon.type === CouponType.PLATFORM
                            ? "خاص بالمنصة"
                            : "مركز"}
                    </Badge>
                  </div>
                  <div className="inline-flex gap-2">
                    <h3 className="text-sm">قيمة الخصم:</h3>
                    <span className="text-base font-bold px-2">
                      {payment.usedCoupon.discount} %
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-base font-semibold text-zgrey-200">
                  لا يوجد كوبون مستخدم
                </p>
              )}

              {(() => {
                const dues = calculateDues({
                  total: payment.total,
                  commission: commission,
                  coupon: payment.usedCoupon ?? undefined,
                });

                return (
                  <div className="flex flex-col items-start space-y-2">
                    <div className="rflex gap-2">
                      <h3 className="text-sm">بعد الخصم</h3>
                      <h3 className="text-sm text-zblue-200">
                        {dues.totalAfterCoupon.toFixed(2)} sar
                      </h3>
                    </div>

                    <div className="rflex gap-2">
                      <h3 className="text-sm">حصة المستشار</h3>
                      <h3 className="text-sm text-zblue-200">
                        {dues.consultantEarning.toFixed(2)} sar
                      </h3>
                    </div>

                    <div className="rflex gap-2">
                      <h3 className="text-sm">حصة المنصة</h3>
                      <h3 className="text-sm text-zblue-200">
                        {dues.platformEarning.toFixed(2)} sar
                      </h3>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
}
