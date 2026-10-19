// React & Next
import React, { Suspense } from "react";

// components
import { Btitle } from "@/components/legacy/layout/titles";
import { Section } from "@/components/legacy/layout/section";
import ConsultantPrograms from "@/components/legacy/consultants/owner/programs";

// prisma data
import { getAllPublishedPrograms } from "@/data/programs";
import { getTaxCommission } from "@/data/admin/settings/finance";
import GlobalSkeleton from "@/components/shared/global-skeleton";
import { cacheLife } from "next/cache";

const Page: React.FC = async () => {
  // programs
  "use cache";
  cacheLife("weeks");
  // only the card fields the client grid renders (never commission)
  const programs = ((await getAllPublishedPrograms()) ?? []).map((p) => ({
    id: p.id,
    prid: p.prid,
    image: p.image,
    title: p.title,
    category: p.category,
    summary: p.summary,
    price: p.price,
  }));

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
