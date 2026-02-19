"use client";
// React & Next
import React from "react";

// package
import { format } from "date-fns";
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

// primsa types
import { UserRole } from "@/lib/generated/prisma/enums";

// types
import { Lang } from "@/types/types";

const chartConfig = {
  user: {
    label: "user",
    color: "hsl(var(--chart-1))",
  },
  owner: {
    label: "consultant",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// props
interface Props {
  reports: {
    role: UserRole;
    created_at: Date | null;
  }[];
  count: {
    user: number;
    owner: number;
    clinet: number;
  };
  lang?: Lang;
}

// char type
interface ChartData {
  date: string;
  user: number;
  owner: number;
}

export function UserStatistics({ reports, count, lang }: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // data
  const [data, setData] = React.useState<ChartData[]>([]);

  // on load
  React.useEffect(() => {
    const chartData = reports.reduce((i: ChartData[], role) => {
      // format date
      const date = role.created_at
        ? format(role.created_at, "yyyy-MM-dd")
        : null;

      // if date not exist
      if (!date) return i;

      // find or create an entry for the date
      const exist = i.find((e) => e.date === date);

      // if user exist
      if (exist) {
        // entry exists, increment the user/owner counts
        if (role.role === UserRole.USER) {
          exist.user += 1;
        } else if (role.role === UserRole.OWNER) {
          exist.owner += 1;
        }
      } else {
        // create a new entry with the role count for that date
        const newEntry = {
          date,
          user: role.role === UserRole.USER ? 1 : 0,
          owner: role.role === UserRole.OWNER ? 1 : 0,
        };
        i.push(newEntry);
      }
      return i;
    }, []);

    // update data state
    setData(chartData);
  }, [reports]);
  // return
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEn ? "registered users" : "الحسابات المسجلة"}</CardTitle>
        <CardDescription>
          {isEn ? "users" : "العملاء"} {count.clinet} |{" "}
          {isEn ? "owner" : "المستشارون"} {count.owner}
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
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="user"
              type="monotone"
              stroke={chartConfig.user.color}
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="owner"
              type="monotone"
              stroke={chartConfig.owner.color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col w-full items-start gap-2">
          <h3 className="text-sm">
            {isEn
              ? "shwerni.sa registered users"
              : "المستخدمين المسجلين علي منصة شاورني"}
          </h3>
          <h6>
            {isEn
              ? "showing total registered users of"
              : "إجمالي عدد الحسابات علي المنصة"}{" "}
            {count.user}
          </h6>
        </div>
      </CardFooter>
    </Card>
  );
}
