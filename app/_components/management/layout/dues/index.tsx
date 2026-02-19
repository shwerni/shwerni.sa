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
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DuesTable from "./table";
import { Button } from "@/components/ui/button";
import Spinner from "@/app/_components/layout/skeleton/spinners";

// prisma data
import { getDuesAdminByMonth } from "@/data/admin/dues";

import { UserRole } from "@/lib/generated/prisma/enums";
// types
import { Lang } from "@/types/types";

// constants
import { zMonths } from "@/constants";

// icons
import { Boxes, ExternalLink } from "lucide-react";

import { isEnglish, findUser } from "@/utils";

// types
interface Dues {
  oid: number;
  consultantId: number;
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
  consultant: {
    name: string;
  };
}

// props
interface Props {
  role: UserRole;
  lang?: Lang;
  dues: Dues[];
  date: string;
}

export default function Dues({ role, dues, date, lang }: Props) {
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
        getDuesAdminByMonth(rdate).then((response) => {
          if (response !== null) setOrders(response);
        });
      });
    }
  }

  // return
  return (
    <div className="w-11/12 mx-auto space-y-5" dir={isEn ? "ltr" : "rtl"}>
      <div className="space-y-3">
        {/* header */}
        <div className="flex flex-row justify-between items-center">
          <h3 className="text-xl">{isEn ? "dues" : "المستحقات"}</h3>
          {isEn && <Button className="zgreyBtn">export as csv</Button>}
        </div>
        <div className="flex justify-between">
          {/* link to total grouped dues */}
          {role === UserRole.ADMIN && (
            <Link href={`${findUser(role)?.url}dues/total`}>
              <div className="flex flex-row gap-1 items-center">
                <Boxes className="w-6" />
                <h6 className="pt-1">
                  {isEn ? "total grouped dues" : "المستحقات المجمعة"}
                </h6>
                <ExternalLink className="w-3.5" />
              </div>
            </Link>
          )}
          <div className="cflex">
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
                {isEn ? "owner" : "المستشار"}
              </TableHead>
              <TableHead className="text-right">
                {isEn ? "date" : "التاريخ"}
              </TableHead>
              <TableHead className="text-right">
                {isEn ? "amount" : "المبلغ"}
              </TableHead>
              <TableHead className="text-right">
                {isEn ? "due" : "المستحق"}
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        {/* table body */}
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
          <DuesTable dues={orders} role={role} isEn={isEn} />
        )}
      </div>
    </div>
  );
}
