/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// React & Next
import React from "react";

// packages
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { parseISO, compareAsc, format } from "date-fns";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

// utils
import { isEnglish } from "@/utils";

// types
import { Lang } from "@/types/types";

// props
interface Props {
  reports: any;
  lang?: Lang;
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function AnalyticVisitor({ reports, lang }: Props) {
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

  // loading
  if (!data.length) return <p>{isEn ? "loading..." : "تحميل"}</p>;

  // return
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEn ? "visitor" : "الزيارات"}</CardTitle>
        <CardDescription>
          {isEn
            ? "active users per the selected period - google Analytics"
            : "إحصائيات جوجل للزيارت - المستخدمين الفعليين"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} dir="ltr">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="users"
              label={isEn ? "users" : "المستخدمين"}
              fill="hsl(var(--chart-5))"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
