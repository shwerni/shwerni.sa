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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpinnerEn } from "@/app/_components/layout/skeleton/spinners";

// primsa data
import { getTotalDuesCollaboratorByMonth } from "@/data/admin/collaboration";

// constants
import { zMonths } from "@/constants";

// types
import { GroupedDues } from "@/types/types";
// props
interface Props {
  dues: GroupedDues[];
  date: string;
  collaboratorId: string;
}
export default function TotalDuesCollaborator({
  dues,
  date,
  collaboratorId,
}: Props) {
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
      getTotalDuesCollaboratorByMonth(collaboratorId, ndate).then(
        (response) => {
          if (response !== null) setOrders(response);
        },
      );
    });
  }

  // return
  return (
    <div className="w-11/12 mx-auto space-y-5">
      <div className="space-y-3">
        {/* header */}
        <div className="flex flex-row justify-between">
          <h3 className="text-xl">اجمالي المستحقات</h3>
          <h6>مستحقات</h6>
        </div>
        <div className="flex justify-end">
          {/* order month selection */}
          <Select onValueChange={dateRange}>
            <SelectTrigger className="w-[150px] sm:w-[200px] bg-zgrey-50">
              <SelectValue placeholder="pick month" />
            </SelectTrigger>
            <SelectContent className="bg-zgrey-50">
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
              <TableHead className="text-center">المستشار</TableHead>
              <TableHead className="text-center">العدد</TableHead>
              <TableHead className="text-center">الاجمالي</TableHead>
              <TableHead className="text-center">المستحق</TableHead>
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
                      {i.consultant}
                    </TableCell>
                    <TableCell className="text-center">{i.count}</TableCell>
                    <TableCell className="text-center">
                      {i.total.toFixed(2)} sar
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="text-zblack-200 bg-zgrey-50 py-1">
                        {/* later dynamic commision */}
                        {(i.finalTotal / 2).toFixed(2)} sar
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
          <TableCaption>A list of dues.</TableCaption>
          <TableFooter className="bg-transparent!">
            <TableRow>
              <TableCell className="text-center">Total</TableCell>
              <TableCell className="text-center">
                {orders.reduce((a, c) => {
                  return a + c.count;
                }, 0)}{" "}
                orders
              </TableCell>
              <TableCell className="text-center">
                {orders
                  .reduce((a, c) => {
                    return a + c.total;
                  }, 0)
                  .toFixed(2)}{" "}
                sar
              </TableCell>
              <TableCell className="text-center">
                <Badge className="text-zblack-200 bg-green-200 py-1">
                  {(
                    orders.reduce((a, c) => {
                      return a + c.finalTotal;
                    }, 0) / 2
                  ).toFixed(2)}{" "}
                  sar
                </Badge>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
