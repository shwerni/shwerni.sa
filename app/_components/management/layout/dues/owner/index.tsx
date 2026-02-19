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
import { Button } from "@/components/ui/button";
import { SpinnerEn } from "@/app/_components/layout/skeleton/spinners";
import { ScrollArea } from "@/components/ui/scroll-area";

// prisma data
import { getDuesAdminByMonthByCid } from "@/data/admin/dues";

// utils
import { isEnglish, findUser } from "@/utils";
import { dateToString } from "@/utils/moment";

// types
import { Lang } from "@/types/types";

// constant
import { zMonths } from "@/constants";
import { UserRole } from "@/lib/generated/prisma/enums";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// types
interface Dues {
  oid: number;
  name: string | null;
  due_at: Date | null;
  meeting:
    | {
        url: string | null;
        consultantAttendance: boolean | null;
        clientAttendance: boolean | null;
      }[]
    | null;
  payment: {
    total: number;
    commission: number;
    tax: number;
  } | null;
}

// props
interface Props {
  role: UserRole;
  lang?: Lang;
  dues: Dues[];
  date: string;
  cid: number;
  owner: string;
}

export default function OwnerDues({
  role,
  lang,
  dues,
  date,
  cid,
  owner,
}: Props) {
  // check langauge
  const isEn = isEnglish(lang);

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

  // return
  return (
    <div dir={isEn ? "ltr" : "rtl"}>
      <Link
        href={`${findUser(role)?.url}dues`}
        className="flex flex-row gap-1 items-center w-fit mx-5 my-5"
      >
        {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        <h5 className="pt-1">{isEn ? "all dues" : "الجوع جميع المستحقات"}</h5>
      </Link>
      <div className="mx-2">
        <div className="w-11/12 mx-auto space-y-5">
          <div className="space-y-3">
            {/* header */}
            <div className="flex flex-row justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl">{isEn ? "dues" : "المستحقات"}</h3>
                <h6>
                  #{cid} | {owner}
                </h6>
              </div>
              {role === UserRole.ADMIN && (
                <Button className="zgreyBtn">export as csv</Button>
              )}
            </div>
            <div className="flex justify-end">
              {/* order month selection */}
              <Select onValueChange={dateRange}>
                <SelectTrigger className="w-[150px] sm:w-[200px] bg-zgrey-50">
                  <SelectValue placeholder={isEn ? "pick month" : "اختر شهر"} />
                </SelectTrigger>
                <SelectContent className="bg-zgrey-50">
                  <SelectItem value="all">{isEn ? "all" : "الكل"}</SelectItem>
                  {pYears.map((y, index) => (
                    <SelectGroup key={index}>
                      <SelectLabel>
                        {isEn ? "year" : "سنة"} {y}
                      </SelectLabel>
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
                  <TableHead className="text-left">
                    {isEn ? "oid" : "رقم الطلب"}
                  </TableHead>
                  <TableHead className="text-left">
                    {isEn ? "status" : "الحالة"}
                  </TableHead>
                  <TableHead className="text-center">
                    {isEn ? "client" : "العميل"}
                  </TableHead>
                  <TableHead className="text-right">
                    {isEn ? "date" : "التاريخ"}
                  </TableHead>
                  <TableHead className="text-right">
                    {isEn ? "amount" : "المبلغ"}
                  </TableHead>
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
                      // payment
                      const payment = i.payment;
                      // meeting
                      const meeting = i.meeting?.[0];

                      return (
                        <TableRow key={i.oid}>
                          <TableCell className="font-medium">
                            #{i.oid}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`${
                                meeting?.url &&
                                meeting?.clientAttendance &&
                                meeting?.consultantAttendance
                                  ? "bg-green-200"
                                  : "bg-red-200"
                              } w-fit h-fit rounded-2xl px-2`}
                            >
                              {meeting?.url &&
                              meeting?.clientAttendance &&
                              meeting?.consultantAttendance
                                ? isEn
                                  ? "success"
                                  : "تمت"
                                : isEn
                                  ? "incomplete"
                                  : "لم تتم"}
                            </span>
                          </TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell>
                            {i.due_at
                              ? dateToString(i.due_at)
                              : "date not found"}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* {(i.total + i.total * (i.tax / 100)).toFixed(2)} */}
                            {payment?.total.toFixed(2)} {isEn ? "sar" : "ريال"}
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
              <TableCaption>
                {" "}
                {isEn ? "A list of dues." : "قائمة المستحقات"}
              </TableCaption>
              <TableFooter className="bg-transparent!">
                <TableRow>
                  <TableCell className="w-1/2">
                    {" "}
                    {isEn ? "Total" : "الاجمالي"}
                  </TableCell>
                  <TableCell className="text-right">
                    {orders.length} {isEn ? "orders" : "الطلبات"}
                  </TableCell>
                  <TableCell className="text-right">
                    {orders
                      .reduce((a, c) => {
                        // validate
                        if (!c.payment) return 0;

                        // else
                        return (
                          a + (c.payment.total * c.payment.commission) / 100
                        );
                      }, 0)
                      .toFixed(2)}{" "}
                    {isEn ? "sar" : "ريال"}
                  </TableCell>
                  <TableCell className="text-right">
                    {orders
                      .reduce((a, c) => {
                        // validate
                        if (!c.payment) return 0;

                        // else
                        return a + c.payment.total;
                      }, 0)
                      .toFixed(2)}{" "}
                    {isEn ? "sar" : "ريال"}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
