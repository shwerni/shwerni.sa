// React & Next
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ProgramsCarousel from "@/components/clients/home/programs/carousel";

// prisma data
import { getAllPublishedPrograms } from "@/data/program";

const Programs = async () => {
  // programs
  const programs = await getPrograms();

  return (
    <Section className="space-y-10">
      <Title title="تسهل عليك الوصول لنتائج أفضل" subTitle="برامجنا المميزة" />
      {/* programs */}
      <Suspense
        fallback={
          <CardSkeleton
            count={3}
            className="flex items-center justify-between w-11/12"
            CardClassName="w-32 h-32"
          />
        }
      >
        <ProgramsCarousel programs={programs} />;
      </Suspense>
    </Section>
  );
};

const getPrograms = async () => {
  "use cache";
  cacheLife("days");

  // programs
  return await getAllPublishedPrograms();
};

export default Programs;
