// React & Next
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import React, { Suspense } from "react";

// components
import Navigation from "@/components/clients/programs/navigation";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ProgramsHeader from "@/components/clients/programs/header";
import Filter, { FilterContent } from "@/components/clients/programs/filter";

// prisma data
import { getPrograms } from "@/data/program";
import { getSpecialties } from "@/data/specialty";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";
import Programs from "@/components/clients/programs/list";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني – برامجنا الاستشارية",
  description:
    "استفد من استشارات متخصصة تساعدك على تطوير ذاتك وتحقيق أهدافك بثقة. شاورني يقدّم برامج مهنية وشخصية بإشراف خبراء معتمدين. احجز استشارتك اليوم!",
  keywords: defaultMetaApi.keywords,
  openGraph: {
    ...defaultMetaApi.openGraph,
    title: "شاورني – برامجنا الاستشارية",
    description:
      "استفد من استشارات متخصصة تساعدك على تطوير ذاتك وتحقيق أهدافك بثقة. شاورني يقدّم برامج مهنية وشخصية بإشراف خبراء معتمدين. احجز استشارتك اليوم!",
    images: [
      {
        url: `${mainRoute}other/programs.png`,
        alt: "برامج شاورني",
        type: "image/png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    ...defaultMetaApi.twitter,
    title: "شاورني – برامجنا الاستشارية",
    description:
      "استفد من استشارات متخصصة تساعدك على تطوير ذاتك وتحقيق أهدافك بثقة. شاورني يقدّم برامج مهنية وشخصية بإشراف خبراء معتمدين. احجز استشارتك اليوم!",
    images: [
      {
        url: `${mainRoute}other/programs.png`,
        alt: "برامج شاورني",
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
};

// type
// filter data
type FilterParams = {
  search?: string;
  page?: string;
  orderby?: "newest" | "oldest" | "viral";
  specialties?: string;
  categories?: string;
};

// interface
interface Props {
  searchParams: Promise<FilterParams>;
}

const fetchSpecialties = async () => {
  // specialties list
  "use cache";
  cacheLife("weeks");
  return await getSpecialties();
};

export default async function Page({ searchParams }: Props) {
  // params
  const {
    search = "",
    page = "1",
    orderby = "newest",
    specialties = "",
    categories,
  } = await searchParams;

  // specialties list
  const specialtiesList = await fetchSpecialties();

  return (
    <div>
      {/* articles headers */}
      <ProgramsHeader />

      <div className="md:grid grid-cols-5 space-y-5 pb-5">
        {/* side filters */}
        <Filter>
          <FilterContent specialties={specialtiesList} />
        </Filter>

        {/* content */}
        <div className="col-span-4">
          {/* consultant list */}
          <Suspense
            key={`${search}-${page}`}
            fallback={
              <CardSkeleton
                count={9}
                CardClassName="h-64 w-44"
                className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center gap-x-3 gap-y-5"
              />
            }
          >
            <ProgramsList
              search={search}
              page={page}
              specialties={specialties}
              orderby={orderby}
              categories={categories}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

const ProgramsList = async ({
  search,
  page,
  specialties,
  orderby,
  categories,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get articles
  const data = await getPrograms(
    safe,
    search,
    orderby,
    categories?.split(","),
    specialties,
  );

  return (
    <>
      <Programs programs={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
