// React & Next
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import React, { Suspense } from "react";

// components
import RequestTime from "@/components/shared/request-time";
import Navigation from "@/components/clients/programs/navigation";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ProgramsHeader from "@/components/clients/programs/header";
import Filter, { FilterContent } from "@/components/clients/programs/filter";

// prisma data
import { getPrograms } from "@/data/programs";
import { getSpecialties } from "@/data/specialties";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";
import Programs from "@/components/clients/programs/list";
import { CollectionJsonLd } from "@/components/seo/collection-json-ld";

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني"
const title = "برامجنا الاستشارية";
const fullTitle = `${title} | شاورني`;
const description =
  "استفد من استشارات متخصصة تساعدك على تطوير ذاتك وتحقيق أهدافك بثقة. شاورني يقدّم برامج مهنية وشخصية بإشراف خبراء معتمدين. احجز استشارتك اليوم!";
const url = `${mainRoute}programs`;
const ogImage = {
  url: `${mainRoute}other/programs.png`,
  alt: "برامج شاورني",
  type: "image/png",
  width: 1080,
  height: 1080,
};

export const metadata: Metadata = {
  title,
  description,
  keywords: defaultMetaApi.keywords,
  // the same canonical for every search, filter, order and page combination
  alternates: { canonical: url },
  openGraph: {
    ...defaultMetaApi.openGraph,
    title: fullTitle,
    description,
    url,
    images: [ogImage],
  },
  twitter: {
    ...defaultMetaApi.twitter,
    title: fullTitle,
    description,
    images: [ogImage],
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
  // specialties list
  const specialtiesList = await fetchSpecialties();

  return (
    <div>
      {/* articles headers */}
      <ProgramsHeader />

      <div className="md:grid grid-cols-5 space-y-5 pb-5">
        {/* side filters */}
        <Filter>
          {/* the filters read the url (request data): rendered at request time, the frame stays
              in the shell */}
          <Suspense fallback={null}>
            <RequestTime searchParams={searchParams}>
              <FilterContent specialties={specialtiesList} />
            </RequestTime>
          </Suspense>
        </Filter>

        {/* content */}
        <div className="col-span-4">
          {/* program list: the search params are request data, so they're read inside
              suspense and the header and filters stay in the prerendered shell */}
          <Suspense fallback={listSkeleton}>
            <ProgramsResults searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// list skeleton, shown on the first load and on every search or page change
const listSkeleton = (
  <CardSkeleton
    count={9}
    CardClassName="h-64 w-44"
    className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center gap-x-3 gap-y-5"
  />
);

const ProgramsResults = async ({ searchParams }: Props) => {
  // params
  const {
    search = "",
    page = "1",
    orderby = "newest",
    specialties = "",
    categories,
  } = await searchParams;

  return (
    <Suspense key={`${search}-${page}`} fallback={listSkeleton}>
      <ProgramsList
        search={search}
        page={page}
        specialties={specialties}
        orderby={orderby}
        categories={categories}
      />
    </Suspense>
  );
};

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

  // the item list describes the default list only: first page, newest first, no search or filters
  const isDefaultList =
    !search && safe === 1 && (!orderby || orderby === "newest") && !specialties && !categories;

  return (
    <>
      <CollectionJsonLd
        path="programs"
        name={fullTitle}
        description={description}
        items={
          isDefaultList
            ? data.items.map((p) => ({ name: p.title, path: `programs/${p.prid}` }))
            : undefined
        }
      />
      <Programs programs={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
