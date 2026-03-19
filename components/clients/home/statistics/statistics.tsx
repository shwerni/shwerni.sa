// React
import Image from "next/image";
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import Title from "@/components/clients/shared/titles";
import DivMotion from "@/components/shared/div-motion";
import Section from "@/components/clients/shared/section";
import { IconLabel } from "@/components/shared/icon-label";
import { LinkButton } from "@/components/shared/link-button";
import { Counter } from "@/components/clients/home/statistics/counter";
import SkeletonCounter from "@/components/clients/home/statistics/skeleton";

// prisma data
import { getHomeStatistics } from "@/data/statistics";

// icons
import { ArrowLeft } from "lucide-react";

const Statistics = async () => {
  // statistics
  const data = await getStatistics();

  // validate
  if (!data) return;

  // summary
  const statistics = [
    {
      value: data.consultants || 200,
      label: "مستشار خبير",
    },
    {
      value: data.orders || 15000,
      label: "مستفيد سنوياً",
    },
    {
      value: data.monthly || 500,
      label: "حجز  شهري",
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
        className="grid grid-cols-3 px-5 py-8 sm:px-10 sm:py-10 bg-linear-to-b from-[#F1F8FE] from-40% to-white rounded-2xl"
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
  return await getHomeStatistics();
};

const StatisticsValues = async ({
  statistics,
}: {
  statistics: { value: number; label: string }[];
}) => {
  return (
    <>
      {statistics.map((i, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-center gap-3"
        >
          <Counter value={i.value} duration={5000} />
          <h5 className="text-base sm:text-lg">{i.label}</h5>
        </div>
      ))}
    </>
  );
};
export default Statistics;
