// React & Next
import React from "react";

// components
import { Separator } from "@/components/ui/separator";
import CurrencyLabel from "@/app/_components/layout/currency/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

// utils
import { paymentMethodLabel } from "@/utils";
import { meetingLabel } from "@/utils/moment";

// types
import { Reservation } from "@/types/admin";

// prisma types
import { OrderType } from "@/lib/generated/prisma/enums";
import { Reconciliation } from "@/lib/generated/prisma/client";

// props
interface Props {
  order: Reservation & { reconciliation?: Reconciliation };
}

export default function OrderTable({ order }: Props) {
  // meeting
  const meeting = order.meeting;

  // payment
  const payment = order.payment;

  // validate
  if (!meeting || !payment) return;

  // label
  const label = meetingLabel(meeting[0]?.time, meeting[0]?.date);

  // order item
  const OrderItem = (title: string, value: React.ReactNode) => {
    return (
      <div className="sm:flex flex-row grid grid-cols-2 gap-5">
        <h3 className="text-sm font-bold text-zblue-200">{title}</h3>
        <h3 className="text-sm">{value}</h3>
      </div>
    );
  };

  // return
  return (
    <>
      {/* small screens */}
      <div className="sm:hidden block">
        {/* details tabel */}
        <div className="grid justify-between my-3">
          {/* order oid */}
          {OrderItem("رقم الطلب", order?.oid)}
          {/* seperator */}
          <Separator className="w-11/12 my-2" />
          {/* name of client */}
          {OrderItem("الاسم", order?.name)}
          {/* seperator */}
          <Separator className="w-11/12 my-2" />
          {order?.program?.title && (
            <>
              {OrderItem("البرنامج", order?.program.title)}
              {/* seperator */}
              <Separator className="w-11/12 my-2" />
            </>
          )}
          {order?.sessionCount > 1 && (
            <>
              {OrderItem("عدد الجلسات", order?.sessionCount)}
              {/* seperator */}
              <Separator className="w-11/12 my-2" />
            </>
          )}
          {/* name of consultant owner */}
          {OrderItem(
            "اسم المستشار",
            order.type === OrderType.INSTANT &&
              (order.consultantId === 36 || order.consultantId === 193)
              ? "مستشار شاورني"
              : order?.consultant.name,
          )}
          {/* seperator */}
          <Separator className="w-11/12 my-2" />
          {/* total */}
          {OrderItem(
            "التكلفة",
            <CurrencyLabel
              variant="sm"
              amount={payment.total}
              tax={payment.tax}
              textStyle="text-sm"
            />,
          )}
          {/* seperator */}
          <Separator className="w-11/12 my-2" />
          {/* duration */}
          {!order?.reconciliation &&
            OrderItem("مدة الاستشارة", meeting?.[0].duration + " دقيقة")}
          {/* seperator */}
          <Separator className="w-11/12 my-2" />
          {/* duration */}
          {payment?.method && (
            <>
              {OrderItem("طريقة الدفع", paymentMethodLabel(payment.method))}
              {/* seperator */}
              <Separator className="w-11/12 my-2" />
            </>
          )}
          {/* meeting date & time label */}
          {
            <div className="sm:col-span-2 sm:flex flex-row grid grid-cols-2 gap-5">
              <h3 className="text-sm text-zblue-200">موعد الاستشارة</h3>
              <h3 className="text-sm">
                {order?.reconciliation
                  ? "سيتم تحديد موعد الجلسة مع الطرف الاخر"
                  : label}
              </h3>
            </div>
          }
        </div>
      </div>
      {/* large screens */}
      <Table className="w-fit mx-auto hidden sm:block">
        <TableBody>
          <TableRow>
            <TableCell className="font-bold text-zblue-200">
              رقم الطلب
            </TableCell>
            <TableCell>
              <h3 className="text-sm">{order?.oid}</h3>
            </TableCell>
            <TableCell className="font-bold text-zblue-200">الاسم</TableCell>
            <TableCell>
              <h3 className="text-sm">{order?.name}</h3>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-bold text-zblue-200">
              اسم المستشار
            </TableCell>
            <TableCell>
              <h3 className="text-sm">
                {order.type === OrderType.INSTANT &&
                (order.consultantId === 36 || order.consultantId === 193)
                  ? "مستشار شاورني"
                  : order?.consultant.name}
              </h3>
            </TableCell>
            <TableCell className="font-bold text-zblue-200">التكلفة</TableCell>
            <TableCell>
              <CurrencyLabel
                variant="sm"
                amount={payment.total}
                tax={payment.tax}
                textStyle="text-sm"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            {!order?.reconciliation && (
              <>
                <TableCell className="font-bold text-zblue-200">
                  مدة الاستشارة
                </TableCell>
                <TableCell>
                  <h3 className="text-sm">
                    {meeting?.[0].duration + " دقيقة"}
                  </h3>
                </TableCell>
              </>
            )}
            {payment?.method && (
              <>
                <TableCell className="font-bold text-zblue-200">
                  طريقة الدفع
                </TableCell>
                <TableCell>
                  <h3 className="text-sm">
                    {paymentMethodLabel(payment?.method)}
                  </h3>
                </TableCell>
              </>
            )}
          </TableRow>
          <TableRow>
            {order?.program?.title && (
              <>
                <TableCell className="font-bold text-zblue-200">
                  البرنامج
                </TableCell>
                <TableCell>
                  <h3 className="text-sm">{order?.program.title}</h3>
                </TableCell>
              </>
            )}
            {order?.sessionCount > 1 && (
              <>
                <TableCell className="font-bold text-zblue-200">
                  عدد الجلسات
                </TableCell>
                <TableCell>
                  <h3 className="text-sm">{order?.sessionCount}</h3>
                </TableCell>
              </>
            )}
          </TableRow>
          {
            <TableRow>
              <TableCell className="font-bold text-zblue-200">
                ميعاد الاستشارة
              </TableCell>
              <TableCell colSpan={3}>
                <h3 className="text-sm">
                  {order?.reconciliation
                    ? "سيتم تحديد موعد الجلسة مع الطرف الاخر"
                    : label}
                </h3>
              </TableCell>
            </TableRow>
          }
        </TableBody>
      </Table>
    </>
  );
}
