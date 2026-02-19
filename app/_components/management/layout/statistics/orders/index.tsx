"use client";
// React & Next
import React from "react";

// packages
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

// utils
import { cn } from "@/lib/utils";
import { isEnglish } from "@/utils";

// types
import { Lang } from "@/types/types";

// char config
export const description = "An interactive bar chart";

const chartConfig = {
  views: {
    label: "orders",
  },
  paid: {
    label: "paid",
    color: "hsl(var(--chart-2))",
  },
  other: {
    label: "other",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

// meeting statisics type
interface OrdersStatistics {
  days: { date: string; count: number }[];
  months: { date: string; count: number }[];
  years: { date: string; count: number }[];
}

// props
interface Props {
  paidOrders?: OrdersStatistics;
  otherOrders?: OrdersStatistics;
  lang?: Lang;
}

export default function OrdersStatistics({
  paidOrders,
  otherOrders,
  lang,
}: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // char state
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("paid");

  // day or month or year
  const [period, setPeriod] = React.useState<number>(0);

  // Combine and aggregate counts
  const combineCounts = (
    arr1: { date: string; count: number }[] | undefined,
    arr2: { date: string; count: number }[] | undefined,
  ) => {
    if (!arr1 || !arr2) return;

    // result array
    const result: { [key: string]: { paid: number; other: number } } = {};

    // counts both arrays
    const aggregate = (
      arr: { date: string; count: number }[],
      type: "paid" | "other",
    ) => {
      arr.forEach(({ date, count }) => {
        if (!result[date]) {
          result[date] = { paid: 0, other: 0 };
        }
        result[date][type] += count;
      });
    };

    // get counts
    aggregate(arr1, "paid");
    aggregate(arr2, "other");

    // format result
    return Object.keys(result).map((date) => ({
      date,
      ...result[date],
    }));
  };

  // data
  const days = combineCounts(paidOrders?.days, otherOrders?.days);
  const months = combineCounts(paidOrders?.months, otherOrders?.months);
  const years = combineCounts(paidOrders?.years, otherOrders?.years);
  const data = period === 0 ? days : period === 1 ? months : years;

  // if not exist
  if (!data || data.length === 0) return <h3>loading...</h3>;

  return (
    <div className="space-y-5">
      {/* toggle period button */}
      <div className="rflex gap-2">
        {[
          isEn ? "days" : "بالايام",
          isEn ? "months" : "بالشهور",
          isEn ? "years" : "السنوات",
        ].map((i, index) => (
          <Button
            type="button"
            key={index}
            onClick={() => setPeriod(index)}
            className={cn(
              "zgreyBtn",
              period === index ? "bg-black! text-white!" : "",
            )}
          >
            {i}
          </Button>
        ))}
      </div>
      {/* chart */}
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>{isEn ? "Orders" : "الطلبات"}</CardTitle>
            <CardDescription>
              {isEn ? "paid & other orders" : "إحصائيات الطلبات"}
            </CardDescription>
          </div>
          <div className="flex">
            {[
              { label: isEn ? "paid" : "مدفوع", state: "paid" },
              { label: isEn ? "other" : "اخري", state: "other" },
            ].map((key) => {
              const chart = key.state as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-xs text-muted-foreground">
                    {key.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
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
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value = "") => {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) {
                    return value;
                  }
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      if (isNaN(date.getTime())) {
                        return value;
                      }
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
