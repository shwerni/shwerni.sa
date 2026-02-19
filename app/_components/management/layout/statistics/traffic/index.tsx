/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// React & Next
import React from "react";

// packages
import { compareAsc } from "date-fns";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

// icons
import { TrendingUp } from "lucide-react";

// props
interface Props {
  reports?: any;
  lang?: Lang;
}

export function AnalyticsTraffic({ reports, lang }: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // data
  const [data, setData] = React.useState<any[]>([]);
  const [chartConfig, setChartConfig] = React.useState<any>({});

  // on load
  React.useEffect(() => {
    if (reports.rows) {
      // source
      const sources = Array.from(
        new Set(reports.rows.map((row: any) => row.dimensionValues[0].value)),
      );

      // dynamic config
      const dynamicConfig: Record<string, { label: string; color: string }> =
        sources.reduce(
          (
            config: Record<string, { label: string; color: string }>,
            source: any,
            index: any,
          ) => {
            return {
              ...config,
              [source]: {
                label: source,
                color: `hsl(var(--chart-${String((index % 5) + 1)}))`,
              },
            };
          },
          {},
        );

      // sorted data
      const sortedData = reports.rows
        .map((row: any) => ({
          source: row.dimensionValues[0].value,
          count: parseInt(row.metricValues[0].value, 10),
          fill: dynamicConfig[row.dimensionValues[0].value]?.color || "#ccc",
        }))
        .sort((a: any, b: any) => compareAsc(a.date, b.date));

      setChartConfig(dynamicConfig);
      setData(sortedData);
    }
  }, [reports]);

  // if not exist
  if (!data || data.length === 0) return <h3>loading...</h3>;

  // return
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEn ? "traffic - source" : "مصدر الزيارات"}</CardTitle>
        <CardDescription>
          {isEn ? "google analytic traffic" : "إحصائيات جوجل"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} dir="ltr">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="source"
              type="category"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value = "") =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {isEn
            ? "google analytic new users"
            : "إحصائيات جوجل لمصدر المستخدمين الجدد"}
        </div>
        <div className="flex gap-2">
          <h6>
            {isEn
              ? "total new user from each source"
              : "إجمالي المستخدمين الجدد من كل مصدر"}
          </h6>
          <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}
