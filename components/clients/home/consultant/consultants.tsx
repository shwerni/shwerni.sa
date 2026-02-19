// React & Next
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";
import { LinkButton } from "@/components/shared/link-button";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ConsultantsCarousel from "@/components/clients/home/consultant/carousel";

// prisma data
import { getPuslishedConsultantsForHome } from "@/data/consultant";

// types
import { ConsultantCard } from "@/types/layout";

const Consultants = async () => {
  // consultants
  const consultants: ConsultantCard[] = await getConsultants();

  // validate
  if (!consultants)
    return (
      <div className="flex items-center justify-center w-full">
        <h5>لا يوجد مستشارين متاحين</h5>
      </div>
    );

  return (
    <Section className="bg-blue-50 py-8 sm:py-10 space-y-10">
      {/* title */}
      <Title title="خبرة ودعم نفسي بلا حدود" subTitle="المستشارون الموثوقون" />
      {/* list */}
      <Suspense
        fallback={
          <CardSkeleton
            count={3}
            className="flex justify-between items-center w-11/12"
            CardClassName="w-32 h-32"
          />
        }
      >
        <ConsultantsCarousel consultants={consultants} />
      </Suspense>
      {/* link */}
      <div className="w-fit mx-auto">
        <LinkButton href="/consultants" variant="primary" className="px-6">
          تصفح كافة المستشارين
        </LinkButton>
      </div>
    </Section>
  );
};

export default Consultants;

const getConsultants = async () => {
  "use cache";
  cacheLife("minutes");

  // get consultants
  return await getPuslishedConsultantsForHome();
};
