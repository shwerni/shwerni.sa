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
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpinnerEn } from "@/app/_components/layout/skeleton/spinners";
import { Badge } from "@/components/ui/badge";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";

// prisma data
import {
  getTotalDuesAdminByMonth,
  totalDuesByPaymentMethods,
} from "@/data/admin/dues";

// utils
import {
  exportPaymentMethodsAsXlsx,
  exportTotalDues,
} from "@/utils/excel/dues";
import { isEnglish, findUser } from "@/utils";

// types
import { GroupedDues, Lang } from "@/types/types";

// constants
import { zMonths } from "@/constants";
import { UserRole } from "@/lib/generated/prisma/enums";

// props
interface Props {
  dues: GroupedDues[];
  date: string;
  role: UserRole;
  lang?: Lang;
}
export default function TotalDues({ role, dues, date, lang }: Props) {
  // check langauge
  const isEn = isEnglish(lang);

  // current year
  const cYear = date.slice(0, 4);

  // current month
  const cMonth = date.slice(5, 7);

  // orders
  const [orders, setOrders] = React.useState<GroupedDues[]>(dues);

  // current range
  const rdate = React.useRef<string>(`${cMonth}-${cYear}`);

  // on load
  const [onLoad, startLoading] = React.useTransition();

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
  function dateRange(ndate: string) {
    // update range date ref
    rdate.current = ndate;
    // get new dues
    startLoading(() => {
      getTotalDuesAdminByMonth(ndate).then((response) => {
        if (response !== null) setOrders(response);
      });
    });
  }

  // export as xlsx file
  function exportAsXlsx() {
    // last row totals
    const lastRow = {
      owner: "total",
      count: orders.reduce((a, c) => {
        return a + c.count;
      }, 0),
      total: orders
        .reduce((a, c) => {
          return a + c.total;
        }, 0)
        .toFixed(2),
      finalTotal: orders
        .reduce((a, c) => {
          return a + c.finalTotal;
        }, 0)
        .toFixed(2),
    };
    // export
    startLoading(() => {
      // export total dues
      exportTotalDues(rdate.current, orders, lastRow);
    });
  }

  // export as xlsx file
  function exportPaymentMethods() {
    // export
    startLoading(() => {
      // get total orders by payment method
      totalDuesByPaymentMethods(rdate.current).then((response) => {
        // export total dues
        exportPaymentMethodsAsXlsx(response);
      });
    });
  }

  // return
  return (
    <div className="w-11/12 mx-auto space-y-5">
      <div className="space-y-3">
        {/* header */}
        <div className="flex flex-row justify-between">
          <div>
            <h3 className="text-xl">
              {isEn ? "total dues" : "المستحقات المجمعة"}
            </h3>
            <h6>
              {isEn
                ? "total grouped dues"
                : "اجمالي المستحقات المجمعة لهذا الشهر"}
            </h6>
          </div>
          {role === UserRole.ADMIN && (
            <div className="flex flex-col items-end gap-1">
              <Button
                className="zgreyBtn"
                onClick={() => exportAsXlsx()}
                disabled={onLoad}
              >
                <LoadingBtnEn loading={onLoad}>export as csv</LoadingBtnEn>
              </Button>
              <Button
                className="zgreyBtn"
                onClick={() => exportPaymentMethods()}
                disabled={onLoad}
              >
                <LoadingBtnEn loading={onLoad}>
                  export payemnt methods
                </LoadingBtnEn>
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          {/* order month selection */}
          <Select onValueChange={dateRange}>
            <SelectTrigger className="w-[150px] sm:w-[200px] bg-zgrey-50">
              <SelectValue placeholder={isEn ? "pick month" : "اختر شهر"} />
            </SelectTrigger>
            <SelectContent className="bg-zgrey-50">
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
              <TableHead className="text-center">
                {isEn ? "owner" : "المستشار"}
              </TableHead>
              <TableHead className="text-center">
                {isEn ? "count" : "العدد"}
              </TableHead>
              <TableHead className="text-center">
                {isEn ? "total" : "الاجمالي"}
              </TableHead>
              <TableHead className="text-center">
                {isEn ? "final total" : "المستحق"}
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
          <ScrollArea className="[&>div>div[style]]:block! mt-0! mb-0! w-full h-[50vh] rounded-md">
            <Table>
              <TableBody>
                {orders.map((i, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">
                      <Link href={`${findUser(role)?.url}dues/` + i.cid}>
                        {i.consultant}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">{i.count}</TableCell>
                    <TableCell className="text-center">
                      {/* {(i.total + i.total * (i.tax / 100)).toFixed(2)} */}
                      {i.total.toFixed(2)} {isEn ? "sar" : "ريال"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="text-zblack-200 bg-zgrey-50 py-1">
                        {i.finalTotal.toFixed(2)} {isEn ? "sar" : "ريال"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
              <TableCell className="text-center">
                {" "}
                {isEn ? "Total" : "الاجمالي"}
              </TableCell>
              <TableCell className="text-center">
                {orders.reduce((a, c) => {
                  return a + c.count;
                }, 0)}{" "}
                {orders.length} {isEn ? "orders" : "الطلبات"}
              </TableCell>
              <TableCell className="text-center">
                {orders
                  .reduce((a, c) => {
                    return a + c.total;
                  }, 0)
                  .toFixed(2)}{" "}
                {isEn ? "sar" : "ريال"}
              </TableCell>
              <TableCell className="text-center">
                <Badge className="text-zblack-200 bg-green-200 py-1">
                  {orders
                    .reduce((a, c) => {
                      return a + c.finalTotal;
                    }, 0)
                    .toFixed(2)}{" "}
                  {isEn ? "sar" : "ريال"}
                </Badge>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
