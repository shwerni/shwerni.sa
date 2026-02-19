"use client";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Spinner from "@/app/_components/layout/skeleton/spinners";

// prisma data
import { getDuesAdminByMonth } from "@/data/admin/dues";

// utils
import { dateToString } from "@/utils/moment";
import { calculateDues } from "@/utils/admin/dues";

// constants
import { zMonths } from "@/constants";

// icons
import { Boxes, ExternalLink } from "lucide-react";

// types
import { CouponType } from "@/lib/generated/prisma/enums";

interface Dues {
  oid: number;
  consultantId: number;
  due_at: Date | null;
  meeting: {
    done: boolean;
    url: string | null;
    consultantAttendance: boolean | null;
    clientAttendance: boolean | null;
  }[];
  payment: {
    total: number;
    commission: number;
    tax: number;
    usedCoupon?: {
      discount: number;
      type: CouponType;
    } | null;
  } | null;
  consultant: {
    name: string;
  };
}

export default function DuesAdmin(props: { dues: Dues[]; date: string }) {
  const { dues, date } = props;
  const [orders, setOrders] = React.useState<Dues[]>(dues);
  const [onLoad, startLoading] = React.useTransition();

  const cYear = date.slice(0, 4);
  const cMonth = date.slice(5, 7);
  const mIndex =
    zMonths.indexOf(cMonth) !== zMonths.length
      ? zMonths.indexOf(cMonth) + 1
      : zMonths.indexOf(cMonth);
  const nMonths = zMonths.slice(0, mIndex);
  const pYears = Array.from(
    { length: Number(cYear) - 2023 + 1 },
    (_, index) => Number(cYear) - index,
  );

  function dateRange(rdate: string) {
    if (rdate == "all") {
      setOrders(dues);
    } else {
      startLoading(() => {
        getDuesAdminByMonth(rdate).then((response) => {
          if (response !== null) setOrders(response);
        });
      });
    }
  }

  return (
    <div className="w-11/12 mx-auto space-y-5">
      <div className="space-y-3">
        <div className="flex flex-row justify-between items-center">
          <h3 className="text-xl">dues</h3>
          <Button className="zgreyBtn">export as csv</Button>
        </div>
        <div className="flex justify-between">
          <Link href="/zadmin/dues/total">
            <div className="flex flex-row gap-1 items-center">
              <Boxes className="w-6" />
              <h6 className="pt-1">total grouped dues</h6>
              <ExternalLink className="w-3.5" />
            </div>
          </Link>
          <div className="cflex">
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
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">oid</TableHead>
              <TableHead className="text-left">status</TableHead>
              <TableHead className="text-center">owner</TableHead>
              <TableHead className="text-right">date</TableHead>
              <TableHead className="text-right">consultant</TableHead>
              <TableHead className="text-right">platform</TableHead>
              <TableHead className="text-right">total</TableHead>
              <TableHead className="text-right">final</TableHead>
            </TableRow>
          </TableHeader>
        </Table>

        {onLoad ? (
          <div className="cflex h-[55vh]">
            <Spinner
              style="stroke-zgrey-100 w-6 h-6"
              title="loading"
              tstyle="text-zgrey-100 pt-1"
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="cflex h-[55vh]">
            <h3>no orders have been placed this month.</h3>
          </div>
        ) : (
          <ScrollArea className="[&>div>div[style]]:block! mt-0! mb-0! w-[85vw] sm:w-full h-[55vh] rounded-md">
            <Table>
              <TableBody>
                {orders.map((i) => {
                  const dues =
                    i.payment &&
                    calculateDues({
                      total: i.payment.total,
                      commission: i.payment.commission,
                      coupon: i.payment.usedCoupon ?? undefined,
                    });

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
                      <TableCell>
                        <Link href={"/zadmin/dues/" + i.consultantId}>
                          {i.consultant.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {i.due_at ? dateToString(i.due_at) : "date not found"}
                      </TableCell>
                      <TableCell className="text-right">
                        {dues?.consultantEarning.toFixed(2)} sar
                      </TableCell>
                      <TableCell className="text-right">
                        {dues?.platformEarning.toFixed(2)} sar
                      </TableCell>
                      <TableCell className="text-right">
                        {i.payment?.total.toFixed(2)} sar
                      </TableCell>
                      <TableCell className="text-right">
                        {dues?.totalAfterCoupon.toFixed(2)} sar
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

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
                    const dues = calculateDues({
                      total: c.payment.total,
                      commission: c.payment.commission,
                      coupon: c.payment.usedCoupon ?? undefined,
                    });
                    return a + dues.consultantEarning;
                  }, 0)
                  .toFixed(2)}{" "}
                sar
              </TableCell>
              <TableCell className="text-right">
                {orders
                  .reduce((a, c) => {
                    if (!c.payment) return a;
                    const dues = calculateDues({
                      total: c.payment.total,
                      commission: c.payment.commission,
                      coupon: c.payment.usedCoupon ?? undefined,
                    });
                    return a + dues.platformEarning;
                  }, 0)
                  .toFixed(2)}{" "}
                sar
              </TableCell>
              <TableCell className="text-right">
                {orders
                  .reduce((a, c) => {
                    if (!c.payment) return a;
                    const dues = calculateDues({
                      total: c.payment.total,
                      commission: c.payment.commission,
                      coupon: c.payment.usedCoupon ?? undefined,
                    });
                    return a + dues.totalAfterCoupon;
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
