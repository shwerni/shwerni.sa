/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// React & Next
import React from "react";

// packages
import { parseISO, compareAsc, format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// utils
import { isEnglish } from "@/utils";

// types
import { Lang } from "@/types/types";

const chartConfig = {
  users: {
    label: "users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

// props
interface Props {
  reports: any;
  lang?: Lang;
}

export function AnalyticsActive({ reports, lang }: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // data
  const [data, setData] = React.useState<any[]>([]);

  // on load
  React.useEffect(() => {
    if (reports.rows) {
      const sortedData = reports.rows
        .map((row: any) => ({
          date: format(parseISO(row.dimensionValues[0].value), "yyyy-MM-dd"),
          users: parseInt(row.metricValues[0].value, 10),
        }))
        .sort((a: any, b: any) => compareAsc(a.date, b.date));
      setData(sortedData);
    }
  }, [reports]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEn ? "total users" : "إجمالي الزيارات"}</CardTitle>
        <CardDescription>
          {isEn
            ? "goolge analytics - active users per the selected period"
            : "المستخدمين المتفاعلون - إحصائيات جوجل"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} dir="ltr">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={true}
              axisLine={true}
              tickMargin={1}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="users"
              label="traffic"
              type="monotone"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex  flex-col w-full items-start gap-2 text-sm">
          <h3 className="text-sm">
            {isEn ? "total users" : "إجمالي زيارات المستخدمين"}
          </h3>
          <h6>
            {isEn
              ? "total active user by google analytic"
              : "المستخدمين الفعليين المتفاعلون علي الموقع - إحصائيات جوجل"}
          </h6>
        </div>
      </CardFooter>
    </Card>
  );
}
