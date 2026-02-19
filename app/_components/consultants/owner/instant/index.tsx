"use client";
// React  & Next
import React from "react";

// package
import moment from "moment";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import InstantForm from "./form";
import { Btitle } from "@/app/_components/layout/titles";
import { Section } from "@/app/_components/layout/section";
import { Separator } from "@/components/ui/separator";

// lib
import { newOnlineUser } from "@/lib/database/supabase";

// utils
import { meetingLabel } from "@/utils/moment";

// prisma types
import { Instant } from "@/lib/generated/prisma/client";

// types
import { Reservation } from "@/types/admin";

// icons
import { ExternalLink } from "lucide-react";

// props
interface Props {
  cid: number;
  author: string;
  date: string;
  time: string;
  orders: Reservation[] | null;
  instant: Instant | null;
  supabaseConfig: { url: string; anonKey: string };
}

const InstantOwners: React.FC<Props> = ({
  author,
  cid,
  orders,
  instant,
  time,
  date,
  supabaseConfig,
}) => {
  // check if there order now
  const checkOrders = () => {
    // no orders exist, available
    if (!orders || orders.length === 0) return true;

    // new order time
    const newOrder = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");

    // compare with old orders
    return !orders.some((order) => {
      const orderTime = moment(
        `${order.meeting?.[0].date} ${order.meeting?.[0].time}`,
        "YYYY-MM-DD HH:mm"
      );

      // one hour later
      const before = orderTime.clone().subtract(1, "hour");
      // half hour later
      const after = orderTime.clone().add(30, "minutes");

      // Check if order is within the time window
      return newOrder.isSameOrAfter(before) && newOrder.isBefore(after);
    });
  };

  // available
  const available = checkOrders();

  // on load
  React.useEffect(() => {
    newOnlineUser(supabaseConfig, author);
  }, [author, supabaseConfig]);

  // return
  return (
    <Section>
      <div className="space-y-5">
        {/* title */}
        <Btitle
          title="حجز فوري"
          subtitle="فعل الحجز الفوري واستقبل حجوزاتك فوراً"
        />
        {/* toggle state */}
        <InstantForm
          cid={cid}
          author={author}
          instant={instant}
          available={available}
        />
        {/* if not available */}
        {!available ? (
          <div>
            <h6 className="text-red-500">
              لا يمكن تفعيل الحجز الفوري لوجود حجز آخر الآن أو سيبدأ قريبا قريب
            </h6>
            <h6 className="flex items-center">
              زيارة صفحة حجوزاتك
              <ExternalLink className="w-4 text-zblue-200" />
            </h6>
          </div>
        ) : (
          ""
        )}
        {/* table of user ready */}
        {orders && orders.length ? (
          <div className="">
            <h3 className="my-3">حجوزات قادمة</h3>
            <Card className="w-fit">
              <CardHeader>
                <CardTitle className="text-base text-zblue-200">
                  الحجوزات القادمة
                </CardTitle>
                <CardDescription></CardDescription>
                <CardContent className="space-y-3">
                  {orders.map((i, index) => {
                    // meeting
                    const meeting = i.meeting;

                    if (meeting)
                      return (
                        <div key={index} className="space-y-2 w-11/12 max-w-72">
                          <h3>
                            {i.name} | {i.oid}
                          </h3>
                          <h6>{meetingLabel(meeting[0].time, meeting[0].date)}</h6>
                          <Separator className="w-10/12 max-w-40 mx-auto" />
                        </div>
                      );
                  })}
                </CardContent>
              </CardHeader>
            </Card>
          </div>
        ) : (
          ""
        )}
      </div>
    </Section>
  );
};

export default InstantOwners;
