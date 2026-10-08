// React & Next
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import React, { Suspense } from "react";

// nuqs server
import { searchParamsCache } from "@/lib/nuqs/consultants";

// components
import RequestTime from "@/components/shared/request-time";
import Consultants from "@/components/clients/consultants/list";
import Navigation from "@/components/clients/consultants/navigation";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ConsultantsHeader from "@/components/clients/consultants/header";
import Search from "@/components/clients/consultants/reservation/search";
import Filter, { FilterContent } from "@/components/clients/consultants/filter";
import { CollectionJsonLd } from "@/components/seo/collection-json-ld";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";

// prisma data
import { getSpecialties } from "@/data/specialties";
import { getConsultants } from "@/data/consultant";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني"
const title = "المستشارون";
const fullTitle = `${title} | شاورني`;
const description =
  "احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.";
const url = `${mainRoute}consultants`;
const ogImage = {
  url: `${mainRoute}meta/consultants.jpeg`,
  alt: fullTitle,
  type: "image/jpeg",
  width: 1080,
  height: 1350,
};

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "المستشارون",
    "المستشارين",
    "مستشارين",
    "مشتشار",
    "مستشار نفسي",
    "مستشار أسري",
    "علاج نفسي",
    "therapy",
    "استشارات نفسية",
    "استشارات أسرية",
    "جلسات نفسية",
    "منصة استشارات سعودية",
    "أفضل مستشارين",
    "خبير نفسي",
    "استشارة فورية",
  ],
  // the same canonical for every search, filter and page combination
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

// filter data type — trimmed to active filters only
type FilterParams = {
  search: string;
  page: string;
  gender: string[];
  categories: string[];
};

// interface
interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchSpecialties() {
  "use cache";
  // specialties list
  cacheLife("weeks");
  return await getSpecialties();
}

export default async function Page({ searchParams }: Props) {
  // specialties list
  const specialtiesList = await fetchSpecialties();

  return (
    <div>
      {/* articles headers */}
      <ConsultantsHeader />

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
          {/* search — mobile only */}
          <div className="md:hidden flex justify-center items-center w-11/12 mx-auto my-3">
            <Suspense fallback={null}>
              <RequestTime searchParams={searchParams}>
                <Search />
              </RequestTime>
            </Suspense>
          </div>

          {/* consultant list: the search params are request data, so they're read inside
              suspense and the header and filters stay in the prerendered shell */}
          <Suspense fallback={listSkeleton}>
            <ConsultantsResults searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// list skeleton, shown on the first load and on every search, filter or page change
const listSkeleton = (
  <CardSkeleton
    count={9}
    CardClassName="h-64 w-44"
    className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center gap-x-3 gap-y-5"
  />
);

const ConsultantsResults = async ({ searchParams }: Props) => {
  // parse all params via nuqs — type-safe, no manual split()
  const { search, page, gender, categories } =
    await searchParamsCache.parse(searchParams);

  return (
    <Suspense
      key={`${search}-${page}-${gender.join(",")}-${categories.join(",")}`}
      fallback={listSkeleton}
    >
      <ConsultantsList
        search={search}
        page={page}
        gender={gender}
        categories={categories}
      />
    </Suspense>
  );
};

const ConsultantsList = async ({
  search,
  page,
  gender,
  categories,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get consultants — arrays passed directly, no split() needed
  const data = await getConsultants(safe, search, "random", categories, gender);

  // the item list describes the default list only: first page, no search, every gender and category
  const isDefaultList =
    !search &&
    safe === 1 &&
    gender.length === Object.values(Gender).length &&
    categories.length === Object.values(Categories).length;

  return (
    <>
      <CollectionJsonLd
        path="consultants"
        name={fullTitle}
        description={description}
        items={
          isDefaultList
            ? data.items.map((c) => ({
                name: c.name,
                path: `consultants/${c.cid}`,
              }))
            : undefined
        }
      />
      <Consultants consultants={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
