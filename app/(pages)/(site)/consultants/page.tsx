// React & Next
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import React, { Suspense } from "react";

// nuqs server
import { searchParamsCache } from "@/lib/nuqs/consultants";

// components
import Consultants from "@/components/clients/consultants/list";
import Navigation from "@/components/clients/consultants/navigation";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ConsultantsHeader from "@/components/clients/consultants/header";
import Search from "@/components/clients/consultants/reservation/search";
import Filter, { FilterContent } from "@/components/clients/consultants/filter";

// prisma data
import { getSpecialties } from "@/data/specialties";
import { getConsultants } from "@/data/consultant";

// constants
import { mainRoute } from "@/constants/links";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - المستشارون",
  description:
    "احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.",
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
  openGraph: {
    title: "شاورني - المستشارون",
    type: "website",
    url: `${mainRoute}/consultant`,
    siteName: "شاورني - المستشارون",
    description:
      "احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.",
    images: [
      {
        url: `${mainRoute}other/owners.jpeg`,
        alt: "shwerni",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شاورني - المستشارون",
    description:
      "احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.",
    creator: "@shwernisa",
    images: [
      {
        url: `${mainRoute}other/owners.jpeg`,
        alt: "shwerni",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: `${mainRoute}favicon.ico`,
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
  // parse all params via nuqs — type-safe, no manual split()
  const { search, page, gender, categories } =
    await searchParamsCache.parse(searchParams);

  // specialties list
  const specialtiesList = await fetchSpecialties();

  return (
    <div>
      {/* articles headers */}
      <ConsultantsHeader />

      <div className="md:grid grid-cols-5 space-y-5 pb-5">
        {/* side filters */}
        <Filter>
          <FilterContent specialties={specialtiesList} />
        </Filter>

        {/* content */}
        <div className="col-span-4">
          {/* search — mobile only */}
          <div className="md:hidden flex justify-center items-center w-11/12 mx-auto my-3">
            <Search />
          </div>

          {/* consultant list */}
          <Suspense
            key={`${search}-${page}-${gender.join(",")}-${categories.join(",")}`}
            fallback={
              <CardSkeleton
                count={9}
                CardClassName="h-64 w-44"
                className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center gap-x-3 gap-y-5"
              />
            }
          >
            <ConsultantsList
              search={search}
              page={page}
              gender={gender}
              categories={categories}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

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
  const data = await getConsultants(
    safe,
    search,
    "random",
    categories,
    gender,
  );

  return (
    <>
      <Consultants consultants={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};