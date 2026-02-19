"use client";
// React & Next
import React from "react";

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
import { Button } from "@/components/ui/button";
import { SpinnerEn } from "@/app/_components/layout/skeleton/spinners";
import { ScrollArea } from "@/components/ui/scroll-area";

// prisma data
import { getDuesAdminByMonthByCid } from "@/data/admin/dues";

// prisma type
import { CouponType } from "@/lib/generated/prisma/enums";

// utils
import { dateToString } from "@/utils/moment";
import { calculateDues } from "@/utils/admin/dues";

// constant
import { zMonths } from "@/constants";

// types
interface Dues {
  oid: number;
  name: string;
  due_at: Date;
  meeting: {
    done: boolean;
    clientAttendance: boolean | null;
    consultantAttendance: boolean | null;
    url: string | null;
  }[];
  payment: {
    commission: number;
    total: number;
    tax: number;
    usedCoupon?: {
      discount: number;
      type: CouponType;
    } | null;
  } | null;
}
export default function OwnerDuesAdmin(props: {
  dues: Dues[];
  date: string;
  cid: number;
  owner: string;
}) {
  // props
  const { dues, date, cid, owner } = props;

  // orders
  const [orders, setOrders] = React.useState<Dues[]>(dues);

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

  // new months
  const nMonths = zMonths.slice(0, mIndex);

  // previous years
  const pYears = Array.from(
    { length: Number(cYear) - 2023 + 1 },
    (_, index) => Number(cYear) - index,
  );

  // on selecting month
  function dateRange(rdate: string) {
    if (rdate == "all") {
      setOrders(dues);
    } else {
      startLoading(() => {
        getDuesAdminByMonthByCid(rdate, Number(cid)).then((response) => {
          if (response !== null) setOrders(response);
        });
      });
    }
  }

  return (
    <div className="w-11/12 mx-auto space-y-5">
      <div className="space-y-3">
        {/* header */}
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl">dues</h3>
            <h6>
              #{cid} | {owner}
            </h6>
          </div>
          <Button className="zgreyBtn">export as csv</Button>
        </div>
        <div className="flex justify-end">
          {/* order month selection */}
          <Select onValueChange={dateRange}>
            <SelectTrigger className="w-[150px] sm:w-[200px] bg-zgrey-50">
              <SelectValue placeholder="pick month" />
            </SelectTrigger>
            <SelectContent className="bg-zgrey-50">
              <SelectItem value="all">all</SelectItem>
              {pYears.map((y, index) => (
                <SelectGroup key={index}>
                  <SelectLabel>year {y}</SelectLabel>
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

      <div>
        {/* table header */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">oid</TableHead>
              <TableHead className="text-left">status</TableHead>
              <TableHead className="text-center">client</TableHead>
              <TableHead className="text-right">date</TableHead>
              <TableHead className="text-right">final</TableHead>
              <TableHead className="text-right">amount</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        {/* table body */}
        {onLoad ? (
          <div className="cflex h-[55vh]">
            <SpinnerEn />
          </div>
        ) : orders.length === 0 ? (
          <div className="cflex h-[55vh]">
            <h3>no orders have been placed this month.</h3>
          </div>
        ) : (
          <ScrollArea className="[&>div>div[style]]:block! mt-0! mb-0! w-full h-[55vh] rounded-md">
            <Table>
              <TableBody>
                {orders.map((i) => {
                  const duesCalc = i.payment
                    ? calculateDues({
                        total: i.payment.total,
                        commission: i.payment.commission,
                        coupon: i.payment.usedCoupon
                          ? {
                              discount: i.payment.usedCoupon.discount,
                              type: i.payment.usedCoupon.type,
                            }
                          : undefined,
                      })
                    : null;

                  return (
                    <TableRow key={i.oid}>
                      <TableCell className="font-medium">#{i.oid}</TableCell>
                      <TableCell>
                        <span
                          className={`${
                            i.meeting[0].done ||
                            (i.meeting[0].url &&
                              i.meeting[0].clientAttendance &&
                              i.meeting[0].consultantAttendance)
                              ? "bg-green-200"
                              : "bg-red-200"
                          } w-fit h-fit rounded-2xl px-2`}
                        >
                          {i.meeting[0].done ||
                          (i.meeting[0].url &&
                            i.meeting[0].clientAttendance &&
                            i.meeting[0].consultantAttendance)
                            ? "success"
                            : "incomplete"}
                        </span>
                      </TableCell>
                      <TableCell>{i.name}</TableCell>
                      <TableCell>
                        {i.due_at ? dateToString(i.due_at) : "date not found"}
                      </TableCell>
                      <TableCell className="text-right">
                        {duesCalc
                          ? `${duesCalc.totalAfterCoupon.toFixed(2)} sar`
                          : "0.00 sar"}
                      </TableCell>
                      <TableCell className="text-right">
                        {duesCalc
                          ? `${duesCalc.consultantEarning.toFixed(2)} sar`
                          : "0.00 sar"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
        {/* table footer */}
        <Table className="overflow-hidden mt-0!">
          <TableCaption>A list of dues.</TableCaption>
          <TableFooter className="bg-transparent!">
            <TableRow>
              <TableCell className="w-1/2">Total</TableCell>
              <TableCell className="text-right">
                {orders.length} orders
              </TableCell>
              <TableCell className="text-right">
                {orders
                  .reduce((a, c) => {
                    if (!c.payment) return a;
                    const duesCalc = calculateDues({
                      total: c.payment.total,
                      commission: c.payment.commission,
                      coupon: c.payment.usedCoupon
                        ? {
                            discount: c.payment.usedCoupon.discount,
                            type: c.payment.usedCoupon.type,
                          }
                        : undefined,
                    });
                    return a + duesCalc.totalAfterCoupon;
                  }, 0)
                  .toFixed(2)}{" "}
                sar
              </TableCell>
              <TableCell className="text-right">
                {orders
                  .reduce((a, c) => {
                    if (!c.payment) return a;
                    const duesCalc = calculateDues({
                      total: c.payment.total,
                      commission: c.payment.commission,
                      coupon: c.payment.usedCoupon
                        ? {
                            discount: c.payment.usedCoupon.discount,
                            type: c.payment.usedCoupon.type,
                          }
                        : undefined,
                    });
                    return a + duesCalc.consultantEarning;
                  }, 0)
                  .toFixed(2)}{" "}
                sar
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
