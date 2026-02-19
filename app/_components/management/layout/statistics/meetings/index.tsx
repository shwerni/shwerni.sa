"use client"
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

// char config
export const description = "An interactive bar chart";

const chartConfig = {
  views: {
    label: "meetings",
  },
  done: {
    label: "done",
    color: "hsl(var(--chart-2))",
  },
  yet: {
    label: "yet",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

// meeting statisics type
interface MeetingsStatistics {
  date: string;
  done: number;
  yet: number;
}

export default function MeetingsStatistics(props: {
  meetings: MeetingsStatistics[] | undefined;
}) {
  // props
  const meetings = props.meetings;

  // char state
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("done");

  // char's meetings data
  const total = React.useMemo(
    () => ({
      done: meetings?.reduce((acc, curr) => acc + curr.done, 0),
      yet: meetings?.reduce((acc, curr) => acc + curr.yet, 0),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Meetings - Char</CardTitle>
          <CardDescription>done & yet meetings</CardDescription>
        </div>
        <div className="flex">
          {["done", "yet"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total]?.toLocaleString()}
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
            data={meetings}
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
              tickFormatter={(value) => {
                const date = new Date(value);
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
  );
}
