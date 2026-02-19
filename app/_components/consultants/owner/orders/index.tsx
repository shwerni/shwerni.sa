"use client";
// React & Next
import React from "react";

// packages
import moment from "moment";

// copmonents
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import OrderCard from "@/app/_components/layout/orderCard";

// prisma data
import { getPaidOwnersOrdersByAuthorAndMonth } from "@/data/order/reserveation";

// prisma types

// types
import { DateTime } from "@/types/types";
import { Reservation } from "@/types/admin";

// constant
import { zMonths } from "@/constants";

// client order layout
export default function OwnerOrderLayout(props: {
  orders: Reservation[] | null;
  date: string;
  time: string;
  author: string;
}) {
  // orders
  const orders = props.orders ?? [];

  // props
  const { author, date, time } = props;

  // date & time
  const dateTime = { date, time };
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

  // on load
  const [onLoad, startLoading] = React.useTransition();

  // orders
  const [zOrders, setOrders] = React.useState<Reservation[]>(orders);

  // upcoming orders
  const newOrder = zOrders.filter((o) =>
    moment(
      `${o.meeting?.[0].date} ${o.meeting?.[0].time}:00`,
      "YYYY-MM-DD HH:mm:ss",
    ).isAfter(moment(`${date} ${time}:00`, "YYYY-MM-DD HH:mm:ss")),
  );

  // on selecting month
  function dateRange(rdate: string) {
    if (rdate == "all") {
      setOrders(orders);
    } else {
      startLoading(() => {
        getPaidOwnersOrdersByAuthorAndMonth(author, rdate).then((response) => {
          if (response !== null) setOrders(response);
        });
      });
    }
  }

  return (
    <div className="my-10 mx-3 sm:mx-auto py-3 px-2 sm:px-5" dir="rtl">
      {/* orders */}
      <div className="flex flex-col my-5">
        <div className="flex flex-row justify-between items-center">
          {/* title */}
          <h3 className="sm:text-3xl text-2xl font-bold">الطلبات</h3>
          {/* order month selection */}
          <Select onValueChange={dateRange}>
            <SelectTrigger className="w-[150px] sm:w-[200px] " dir="rtl">
              <SelectValue placeholder="اختر شهر" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">كل الاوقات</SelectItem>
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
        {/* Separator */}
        <Separator className="my-3 w-11/12 mx-auto" />
      </div>
      {/* consultant all orders  */}
      <Tabs defaultValue="all" dir="rtl">
        <TabsList className="grid grid-cols-2 max-w-[400px] mx-auto">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="upcoming">قادم</TabsTrigger>
        </TabsList>
        {onLoad ? (
          <div>
            <Skeleton className="bg-zgrey-50 w-80 h-40 mx-auto my-5" />
            <Skeleton className="bg-zgrey-50 w-80 h-40 mx-auto my-5" />
          </div>
        ) : (
          <>
            {/* all orders */}
            <TabsContent value="all">
              <OrderCards orders={zOrders} time={dateTime} />
            </TabsContent>
            {/* upcoming */}
            <TabsContent value="upcoming">
              <OrderCards orders={newOrder} time={dateTime} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
function OrderCards(props: {
  orders: Reservation[] | undefined | null;
  time: DateTime;
}) {
  // orders
  const { orders, time } = props;

  // return
  return (
    <>
      {orders?.length !== 0 ? (
        <ScrollArea className="h-halfFull my-5">
          {orders?.map((i, index) => (
            <React.Fragment key={index}>
              <OrderCard order={i} owner={true} time={time} />
            </React.Fragment>
          ))}
        </ScrollArea>
      ) : (
        <div className="cflex my-20">
          <h3>لا يوجد طلبات</h3>
        </div>
      )}
      {/* number of orders */}
      <div className="mt-10">
        <h5>اجمالي عدد الطلبات {orders?.length}</h5>
      </div>
    </>
  );
}
