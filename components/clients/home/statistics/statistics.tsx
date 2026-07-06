// React
import { Suspense } from "react";
import { cacheLife } from "next/cache";
// components
import Title from "@/components/clients/shared/titles";
import DivMotion from "@/components/shared/div-motion";
import Section from "@/components/clients/shared/section";
import { Counter } from "@/components/clients/home/statistics/counter";
import SkeletonCounter from "@/components/clients/home/statistics/skeleton";
// prisma data
import { getHomeSecondaryStatistics } from "@/data/statistics";

const Statistics = async () => {
  // statistics
  const data = await getStatistics();
  // validate
  if (!data) return;
  // summary
  const statistics = [
    {
      value: data.paidOrders || 200,
      label: "مستفيد ومستفيدة",
    },
    {
      value: data.totalMinutes || 15000,
      label: "دقيقة من الاستشارات الأسرية",
    },
    {
      value: data.avgRate || 4.8,
      label: "رضا المستشارين",
      decimals: 1,
      suffix: "/٥",
    },
  ];
  return (
    <Section className="w-11/12 space-y-8 mx-auto">
      {/* title */}
      <Title title="الأرقام تحكي القصة" subTitle="احصائيات" />
      {/* statistics */}
      <DivMotion
        variant="blur-in"
        delay={0.5}
        className="grid grid-cols-3 gap-2 sm:gap-6 px-3 py-6 sm:px-10 sm:py-10 bg-linear-to-b from-[#F1F8FE] from-40% to-white rounded-2xl"
      >
        <Suspense fallback={<SkeletonCounter />}>
          <StatisticsValues statistics={statistics} />
        </Suspense>
      </DivMotion>
    </Section>
  );
};

const getStatistics = async () => {
  // data
  "use cache";
  cacheLife("days");
  return await getHomeSecondaryStatistics();
};

const StatisticsValues = async ({
  statistics,
}: {
  statistics: {
    value: number;
    label: string;
    decimals?: number;
    suffix?: string;
  }[];
}) => {
  return (
    <>
      {statistics.map((i, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-center gap-1.5 sm:gap-3 min-w-0 px-1"
        >
          <div className="text-xl sm:text-3xl font-bold">
            <Counter
              value={i.value}
              duration={5000}
              decimals={i.decimals}
              suffix={i.suffix}
            />
          </div>
          <h5 className="text-[11px] leading-snug sm:text-lg text-center break-words">
            {i.label}
          </h5>
        </div>
      ))}
    </>
  );
};

export default Statistics;