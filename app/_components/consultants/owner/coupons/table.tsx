"use client";
// React & Next
import React from "react";
import { useRouter } from "next/navigation";

// components
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CopyBtn from "@/app/_components/layout/copyBtn";
import { ZToast } from "@/app/_components/layout/toasts";
import { ScrollArea } from "@/components/ui/scroll-area";
import Confirm from "@/app/_components/layout/navigation/confirm";

// utils
import { cn } from "@/lib/utils";

// prisma data
import { deleteConsultantsCoupon } from "@/data/coupon";

// prisma types
import { Coupon } from "@/lib/generated/prisma/client";
import { CouponState, CouponVisibility } from "@/lib/generated/prisma/enums";

// icons
import { Trash2 } from "lucide-react";
import { dateToString } from "@/utils/moment";

export function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  // router
  const router = useRouter();

  // delete
  const onDeleteCoupon = async (code: string) => {
    // create
    try {
      // delete
      const result = await deleteConsultantsCoupon(code);

      // validate
      if (result) {
        ZToast({ state: true, message: "تم الحذف بنجاح" });
        router.refresh();
      } else {
        ZToast({ state: false, message: "حدث خطأ أثناء حذف الكوبون" });
      }
    } catch {
      ZToast({ state: false, message: "حدث خطأ أثناء حذف الكوبون" });
    }
  };
  return (
    <ScrollArea
      className="[&>div>div[style]]:block! w-[85vw] sm:w-full h-[55vh]"
      dir="rtl"
    >
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[1000px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">الكود</TableHead>
              <TableHead className="w-24">الخصم</TableHead>
              <TableHead className="w-32">يبدأ في</TableHead>
              <TableHead className="w-32">ينتهي في</TableHead>
              <TableHead className="w-40">عدد مرات الاستخدام</TableHead>
              <TableHead className="w-24">الخصوصية</TableHead>
              <TableHead className="w-24">الحالة</TableHead>
              <TableHead className="w-28">نسخ</TableHead>
              <TableHead className="w-32">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length !== 0 ? (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="w-32 font-bold">
                    {coupon.code}
                  </TableCell>
                  <TableCell className="w-24">{coupon.discount}%</TableCell>
                  <TableCell className="w-32">
                    {coupon.starts_at
                      ? dateToString(coupon.starts_at)
                      : "غير محدد"}
                  </TableCell>
                  <TableCell className="w-32">
                    {coupon.expires_at
                      ? dateToString(coupon.expires_at)
                      : "غير محدد"}
                  </TableCell>
                  <TableCell className="w-40">
                    {coupon.limits ? coupon.limits : "غير محدود"}
                  </TableCell>
                  <TableCell className="w-24">
                    {coupon.visibility === CouponVisibility.PUBLIC
                      ? "عام"
                      : "خاص"}
                  </TableCell>
                  <TableCell className="w-24">
                    <Badge
                      className={cn([
                        "text-black",
                        coupon.status === CouponState.PUBLISHED
                          ? "bg-green-100"
                          : "bg-red-100",
                      ])}
                    >
                      {coupon.status === CouponState.PUBLISHED
                        ? "منشور"
                        : "مخفي"}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-28">
                    <CopyBtn
                      copy={coupon.code}
                      label="نسخ"
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell className="w-32 rflex">
                    <Confirm
                      title="حذف هذا الكوبون ؟"
                      description={`هل انت متأكد من خذف هذا الكوبون #${coupon.code}`}
                      dir="rtl"
                      cancelLabel="إلغاء"
                      action={() => onDeleteCoupon(coupon.code)}
                    >
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="w-4" />
                        حذف
                      </Button>
                    </Confirm>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-lg text-red-500"
                >
                  لا يوجد كوبونات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
