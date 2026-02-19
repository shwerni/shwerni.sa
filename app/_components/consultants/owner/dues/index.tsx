"use client";
// React & Next
import React from "react";
import Link from "next/link";

// components
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/app/_components/layout/skeleton/spinners";
import DuesDialog from "@/app/_components/consultants/owner/dues/duesDialog";

// utils
import { dateToString } from "@/utils/moment";
// import { exportDuesForOwner } from "@/app/_utils/excel/dues";

// prisam data
import { getDuesOwnenByMonth } from "@/data/dues";
import { CouponType } from "@/lib/generated/prisma/enums";

// types
import { Reservation } from "@/types/admin";

// constants
import { zMonths } from "@/constants";

// icons
import { BadgePercent, ExternalLink } from "lucide-react";
import { calculateDues } from "@/utils/admin/dues";

// props
interface Props {
  dues: Reservation[];
  date: string;
  owner: {
    cid: number;
    name: string | null;
    commission: number | null;
  };
  defaultCommission: number | null;
}

export default function DuesOwner({
  dues,
  date,
  owner,
  defaultCommission,
}: Props) {
  // commission
  const zCommission = owner.commission
    ? owner.commission
    : defaultCommission ?? 60;

  // orders
  const [orders, setOrders] = React.useState<Reservation[]>(dues);

  // on load
  const [onLoad, startLoading] = React.useTransition();

  // current year
  const cYear = date.slice(0, 4);

  // current month
  const cMonth = date.slice(5, 7);

  // month index
  const mIndex =
    zMonths.indexOf(cMonth) !== zMonths.length
      ? zMonths.indexOf(cMonth) + 1
      : zMonths.indexOf(cMonth);

  // current range
  // const rdate = React.useRef<string>(`${cMonth}-${cYear}`);

  // new months
  const nMonths = zMonths.slice(0, mIndex);

  // previous years
  const pYears = Array.from(
    { length: Number(cYear) - 2023 + 1 },
    (_, index) => Number(cYear) - index
  );

  // on selecting month
  function dateRange(rdate: string) {
    if (rdate == "all") {
      setOrders(dues);
    } else {
      startLoading(() => {
        getDuesOwnenByMonth(rdate, owner.cid).then((response) => {
          if(response !== null) setOrders(response);
        });
      });
    }
  }

  // export as xlsx file
  // function exportAsXlsx() {
  //   // export
  //   startLoading(() => {
  //     // export total dues
  //     exportDuesForOwner(`${owner.name} ${rdate.current}`, orders);
  //   });
  // }

  // return
  return (
    <div className="w-11/12 mx-auto space-y-5" dir="rtl">
      <div className="space-y-3">
        {/* header */}
        <div className="flex flex-row justify-between items-center">
          <h3 className="text-xl">المستحقات</h3>
          {/* <Button
            className="zgreyBtn"
            onClick={() => exportAsXlsx()}
            disabled={onLoad}
          >
            <LoadingBtn loading={onLoad}>تصدير كملف xlsx</LoadingBtn>
          </Button> */}
        </div>
        <div className="flex items-center justify-between">
          {/* link to total grouped dues */}
          <Link href="/dashboard/orders">
            <div className="flex flex-row gap-1 items-center">
              <h6 className="pt-1">صفحة الطلبات</h6>
              <ExternalLink className="w-3.5" />
            </div>
          </Link>
          <div className="cflex">
            {/* order month selection */}
            <Select onValueChange={dateRange}>
              <SelectTrigger className="w-[150px] sm:w-[200px] bg-zgrey-50">
                <SelectValue placeholder="اختر شهر" />
              </SelectTrigger>
              <SelectContent className="bg-zgrey-50">
                <SelectItem value="all">الكل</SelectItem>
                {pYears.map((y, index) => (
                  <SelectGroup key={index}>
                    <SelectLabel>سنة {y}</SelectLabel>
                    {(Number(cYear) === y
                      ? nMonths.reverse()
                      : zMonths.slice().reverse()
                    ).map((m) => (
                      <SelectItem key={`${m}-${y}`} value={`${m}-${y}`}>
                        {`${m}-${y}`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div>
        {/* table header */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم الطلب</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">التاريخ</TableHead>
              <TableHead className="text-center">الاجمالي</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        {/* table body */}
        {onLoad ? (
          <div className="cflex h-[55vh]">
            <Spinner
              style="stroke-zgrey-100 w-6 h-6"
              title="جاري التحميل"
              tstyle="text-zgrey-100 pt-1"
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="cflex h-[55vh]">
            <h3>لا يوجد طلبات هذا الشهر.</h3>
          </div>
        ) : (
          <ScrollArea className="[&>div>div[style]]:block! mt-0! mb-0! w-full h-[55vh] rounded-md">
            <Table>
              <TableBody>
                {orders.map((i) => {
                  const meeting = i.meeting;
                  const payment = i.payment;

                  if (!meeting || !payment) return null;

                  // Prepare coupon if exists
                  const coupon =
                    payment.usedCoupon && payment.usedCoupon.discount
                      ? {
                        discount: payment.usedCoupon.discount,
                        type: payment.usedCoupon.type as CouponType,
                      }
                      : undefined;

                  // Calculate dues
                  const dues = calculateDues({
                    total: payment.total,
                    commission: payment.commission,
                    coupon,
                  });

                  return (
                    <DuesDialog key={i.oid} order={i} commission={zCommission}>
                      <TableRow
                        className={
                          coupon
                            ? "bg-blue-100 hover:bg-blue-200 transition"
                            : "hover:bg-zgrey-50 transition"
                        }
                      >
                        <TableCell className="text-center">
                          {dues.consultantEarning.toFixed(2)} sar
                        </TableCell>
                        <TableCell className="text-left">
                          {i.due_at ? dateToString(i.due_at) : "لا يسجل"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${meeting[0].done || (meeting[0].url &&
                              meeting[0].clientAttendance &&
                              meeting[0].consultantAttendance)
                              ? "bg-green-200"
                              : "bg-red-200"
                              } text-zblack-200 font-semibold text-center`}
                          >
                            {/* later add meeting map */}
                            {meeting[0].done || (meeting[0].url &&
                              meeting[0].clientAttendance &&
                              meeting[0].consultantAttendance)
                              ? "تمت"
                              : "لم تمم"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">#{i.oid}</TableCell>
                      </TableRow>
                    </DuesDialog>
                  );
                })}

              </TableBody>
            </Table>
          </ScrollArea>
        )}
        {/* table footer */}
        <Table className="overflow-hidden mt-0!">
          <TableCaption className="mb-5">قائمة المستحقات.</TableCaption>
          <TableFooter className="bg-transparent!">
            <TableRow>
              <TableCell className="w-1/2">الاجمالي</TableCell>
              <TableCell>{orders.length} طلبات</TableCell>
              <TableCell>
                <Badge className="bg-zgrey-50 text-zblack-200 text-center font-semibold">
                  {orders.reduce((a, c) => {
                    if (!c.payment) return a;

                    const coupon =
                      c.payment.usedCoupon && c.payment.usedCoupon.discount
                        ? {
                          discount: c.payment.usedCoupon.discount,
                          type: c.payment.usedCoupon.type as CouponType,
                        }
                        : undefined;

                    const dues = calculateDues({
                      total: c.payment.total,
                      commission: c.payment.commission,
                      coupon,
                    });

                    return a + dues.consultantEarning;
                  }, 0).toFixed(2)} sar

                </Badge>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        {/* dues commission or default commission */}
        <div className="rflex gap-1 pb-5">
          <BadgePercent className="w-5" />
          <h3 className="text-sm">
            نسبة العمولة الحالية{" "}
            <span className="text-zblue-200">
              {owner.commission ? owner.commission : defaultCommission}%
            </span>
          </h3>
        </div>
      </div>
    </div>
  );
}
