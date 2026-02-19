// React & Next
import React from "react";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import CopyText from "@/app/_components/layout/copyText";
import { OrderStatus } from "@/app/_components/layout/zStatus";
import PayBtn from "@/app/_components/layout/orderCard/payButton";
import OrderReason from "@/app/_components/layout/orderCard/brief";
import RefundBtn from "@/app/_components/layout/orderCard/refundButton";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// utils
import { meetingUrl, totalAfterTax } from "@/utils";
import { dateToString, timeToArabic } from "@/utils/moment";

// types
import { DateTime } from "@/types/types";
import { Reservation } from "@/types/admin";

// icons
import { CircleCheck } from "lucide-react";

// Props
interface Props {
  order: Reservation;
  owner?: boolean;
  time: DateTime;
}

// copy meeting url
const CopyMeetingUrl = ({ url }: { url: string }) => {
  return (
    <CopyText
      text={url}
      title="اضغط لنسخ الرابط"
      style="pb-1 px-1 text-zblack-200 text-sm text-center text-nowrap font-medium border-b-2 border-zblue-200"
      hide={true}
    />
  );
};

export default function OrderCard({ order, owner, time }: Props) {
  // meeting
  const meeting = order.meeting;

  //  payment
  const payment = order.payment;

  // meeting url
  const url = meetingUrl(order.oid, owner, 1);

  // return
  if (payment && meeting)
    return (
      <Card className="mb-3 mx-auto max-w-[400px]" dir="rtl">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            {/* trigger */}
            <AccordionTrigger className="mx-5 hover:no-underline">
              {/* card header & trigger */}
              <CardHeader className="flex flex-col items-start p-0">
                <div className="rflex gap-1">
                  <CardTitle className="text-lg pt-1">
                    {(owner ? order.name : order.consultant.name) +
                      " #" +
                      order.oid}
                  </CardTitle>
                  <span>
                    {payment.payment === PaymentState.PAID && (
                      <CircleCheck className="text-green-500 w-5" />
                    )}
                  </span>
                </div>
                <CardDescription className="text-sm">{`${
                  meeting?.[0].date
                } | ${timeToArabic(meeting?.[0].time)}`}</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              {/* large screens */}
              <CardContent className="hidden mdsm:block pb-0 pt-0">
                <div className="grid grid-cols-3 justify-items-center items-center gap-3">
                  <span>الحالة</span>
                  <span>الاجمالي</span>
                  <span>مدة الاستشارة</span>
                </div>
                {/* separator */}
                <Separator className="my-3" />
                <div className="grid grid-cols-3 justify-items-center items-center gap-3 text-sm">
                  {/* status */}
                  <OrderStatus payment={payment.payment} />
                  {/* total cost */}
                  <span>{totalAfterTax(payment.total, payment.tax)} ر.س</span>
                  {/* reservation date */}
                  <span>{meeting?.[0].duration} دقيقة</span>
                </div>
                {/* url link */}
                {payment.payment === PaymentState.PAID && (
                  <>
                    {/* separator */}
                    <Separator className="my-3" />
                    <div className="flex justify-between w-3/4 mx-auto my-2">
                      <span>رابط الاجتماع</span>
                      {/* copy meeting url */}
                      <CopyMeetingUrl url={url} />
                    </div>
                  </>
                )}
                {/* description */}
                <>
                  {/* separator */}
                  <Separator className="my-3" />
                  {/* order description */}
                  <OrderReason
                    oid={order.oid}
                    owner={owner}
                    name={order.name}
                    consultant={order.consultant.name}
                    description={order.description}
                    answer={order.answer}
                  />
                </>
              </CardContent>
              {/* small screens */}
              <CardContent className="block mdsm:hidden pb-0 pt-0">
                <div className="grid grid-cols-2 justify-items-center items-center gap-3">
                  {/* order status badge */}
                  <span className="w-full flex justify-start">الحالة</span>
                  <OrderStatus payment={payment.payment} />
                  {/* total */}
                  <span className="w-full flex justify-start">الاجمالي</span>
                  <span>{totalAfterTax(payment.total, payment.tax)} ر.س</span>
                  {/* duration */}
                  <span className="w-full flex justify-start">
                    مدة الاستشارة
                  </span>
                  <span>{meeting?.[0].duration} دقيقة</span>
                  {/* meeting url */}
                  {payment.payment === PaymentState.PAID && (
                    <>
                      <span className="w-full flex justify-start">
                        رابط الاجتماع
                      </span>
                      {/* copy meeting url */}
                      <CopyMeetingUrl url={url} />
                    </>
                  )}
                  {/* description */}
                  <div className="col-span-2 w-full">
                    {/* order description */}
                    <OrderReason
                      oid={order.oid}
                      owner={owner}
                      name={order.name}
                      consultant={order.consultant.name}
                      description={order.description}
                      answer={order.answer}
                    />
                  </div>
                </div>
              </CardContent>
              {/* card footer */}
              {/* order refund & created at */}
              {/* order refund */}
              <div className="flex justify-between items-center w-10/12 mx-auto mt-5">
                {!owner && (
                  <RefundBtn
                    order={order}
                    time={{ date: time.date, time: time.time }}
                  />
                )}
                {!owner && (
                  <PayBtn
                    order={order}
                    time={{ date: time.date, time: time.time }}
                  />
                )}
                {/* order created at */}
                <div className="flex justify-end w-full">
                  <h6>{dateToString(order.created_at)}</h6>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    );
}
