// React & Next
import React, { Suspense } from "react";

// components
import { Btitle } from "@/app/_components/layout/titles";
import { Section } from "@/app/_components/layout/section";
import ConsultantPrograms from "@/app/_components/consultants/owner/programs";

// prisma data
import { getAllPublishedPrograms } from "@/data/program";
import { getTaxCommission } from "@/data/admin/settings/finance";
import GlobalSkeleton from "@/components/shared/global-skeleton";
import { cacheLife } from "next/cache";

const Page: React.FC = async () => {
  // programs
  "use cache";
  cacheLife("seconds");
  const programs = (await getAllPublishedPrograms()) ?? [];
  
  // tax
  const finance = await getTaxCommission();

  return (
    <Section>
      <div className="px-3 py-5">
        <Btitle title="برامجنا الاستشارية" />
        <Suspense fallback={<GlobalSkeleton />}>
          <ConsultantPrograms programs={programs} tax={finance?.tax ?? 15} />
        </Suspense>
      </div>
    </Section>
  );
};

export default Page;
