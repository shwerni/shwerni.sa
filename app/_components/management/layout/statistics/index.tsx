"use server";
// React & Next
import React from "react";
import Link from "next/link";

// components
import { Separator } from "@/components/ui/separator";
import { ZSection } from "@/app/_components/layout/section";
import { UserStatistics } from "@/app/_components/management/layout/statistics/users";
import { AnalyticsActive } from "@/app/_components/management/layout/statistics/active";
import { AnalyticVisitor } from "@/app/_components/management/layout/statistics/visitor";
import { AnalyticsTraffic } from "@/app/_components/management/layout/statistics/traffic";
import StatisticsToday from "@/app/_components/management/layout/statistics/period";
import OrdersStatistics from "@/app/_components/management/layout/statistics/orders";
import StatisticsData from "@/app/_components/management/layout/statistics/data";
import StatisticsLoading from "@/app/_components/layout/skeleton/admin/statistics";

// prisma data
import {
  statisticsAllOtherOrders,
  statisticsAllPaidOrders,
  statisticsgetAllOrders,
  statisticsgetAllOwnerCount,
  statisticsgetToday,
  statisticsgetUsers,
  statisticsgetUsersCount,
} from "@/data/admin/statistics";

// lib
import {
  googleAnalyticsUsers,
  googleAnalyticsUsersSource,
  googleAnalyticsVistiors,
} from "@/lib/api/google-analytics";

// utils
import { isEnglish } from "@/utils";

// types
import { Lang } from "@/types/types";

// icons
import { Ban, ExternalLink } from "lucide-react";

// react icons
import { FaChartBar } from "react-icons/fa";

// props
interface Props {
  date: string;
  lang?: Lang;
}

export default async function Statistics({ lang, date }: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // all orders count
  const orders = await statisticsgetAllOrders();

  // owerns
  const owners = await statisticsgetAllOwnerCount();

  // users
  const users = await statisticsgetUsersCount();

  // users
  const roles = await statisticsgetUsers();

  // google analytic vistor
  const visitor = await googleAnalyticsVistiors();

  // google analytic traffic
  const active = await googleAnalyticsUsers();

  // paid detailed orders
  const paidOrders = await statisticsAllPaidOrders();

  // other detailed orders
  const otherOrders = await statisticsAllOtherOrders();

  // traffic source
  const traffic = await googleAnalyticsUsersSource();

  // today statistics
  const today = await statisticsgetToday(new Date(date), new Date(date));

  if (
    orders === undefined ||
    owners === undefined ||
    users === undefined ||
    roles === undefined ||
    visitor === undefined ||
    active === undefined ||
    paidOrders === undefined ||
    otherOrders === undefined ||
    traffic === undefined ||
    today === undefined
  )
    return <StatisticsLoading dir={isEn ? "ltr" : "rtl"} />;

  // return
  return (
    <ZSection>
      <div className="space-y-5 mx-3" dir={isEn ? "ltr" : "rtl"}>
        <div className="flex items-center gap-x-1.5">
          <h3 className="text-lg capitalize">
            {isEn ? "statistics" : "الإحصائيات"}
          </h3>
          <FaChartBar className="w-5" />
        </div>

        <div className="space-y-10 sm:mx-3">
          {/* Today */}
          <div className="space-y-5">
            {today ? (
              <StatisticsToday date={date} data={today} lang={lang} />
            ) : (
              <NoData />
            )}
          </div>

          {/* Main statistics */}
          {owners && orders ? (
            <StatisticsData
              users={users?.user}
              orders={orders}
              owners={owners}
              lang={lang}
            />
          ) : (
            <NoData />
          )}
          {/* Orders */}
          <div className="space-y-2">
            <h3>{isEn ? "detailed orders" : "الطلبات"}</h3>
            {otherOrders && paidOrders ? (
              <OrdersStatistics
                otherOrders={otherOrders}
                paidOrders={paidOrders}
                lang={lang}
              />
            ) : (
              <NoData />
            )}
          </div>

          <Separator className="w-3/4 mx-auto my-2" />

          {/* Users */}
          <div className="space-y-2">
            <h3>{isEn ? "detailed users" : "المستخدمين"}</h3>
            {visitor ? (
              <AnalyticVisitor reports={visitor} lang={lang} />
            ) : (
              <NoData />
            )}
          </div>

          <Separator className="w-3/4 mx-auto my-2" />

          {/* Google Analytics Users */}
          <div className="space-y-2">
            <h3>
              {isEn ? "visitors google analytics" : "إحصائيات جوجل - الزيارات"}
            </h3>
            {roles && users ? (
              <UserStatistics reports={roles} count={users} lang={lang} />
            ) : (
              <NoData />
            )}
            {active ? (
              <AnalyticsActive reports={active} lang={lang} />
            ) : (
              <NoData />
            )}
          </div>

          <Separator className="w-3/4 mx-auto my-2" />

          {/* Google Analytics Traffic */}
          <div className="space-y-2">
            <h3>
              {isEn
                ? "traffic google analytics"
                : "إحصائيات جوجل - مصدر الزيارات"}
            </h3>
            {traffic ? (
              <AnalyticsTraffic reports={traffic} lang={lang} />
            ) : (
              <NoData />
            )}
          </div>

          <Separator className="w-3/4 mx-auto my-2" />

          {/* External Link */}
          <div className="space-y-2">
            <h3>traffic</h3>
            <Link
              href="https://analytics.google.com/analytics/web/#/p454633641/reports/reportinghub"
              className="flex items-center gap-1"
            >
              <ExternalLink className="w-4" />
              <h6 className="pt-0.5">google analytics dashboard</h6>
            </Link>
          </div>
        </div>
      </div>
    </ZSection>
  );
}

async function NoData() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 rounded-md border bg-gray-50 text-sm">
      <Ban className="w-6 h-6 opacity-40" />
      <span>No data available</span>
    </div>
  );
}
