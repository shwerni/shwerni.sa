// React & Next
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import React, { Suspense } from "react";

// components
import Consultants from "@/components/clients/consultants/list";
import Navigation from "@/components/clients/consultants/navigation";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Appointment from "@/components/clients/consultants/appointment";
import ConsultantsHeader from "@/components/clients/consultants/header";
import Filter, { FilterContent } from "@/components/clients/consultants/filter";

// prisma data
import { getSpecialties } from "@/data/specialty";
import { getConsultants } from "@/data/consultant";

// lib
import { timeZone } from "@/lib/site/time";

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

// type
// filter data
type FilterParams = {
  search?: string;
  page?: string;
  orderby?: "newest" | "oldest" | "viral";
  specialties?: string;
  categories?: string;
  gender?: string;
  rate?: string;
  minCost?: string;
  maxCost?: string;
  time?: string;
  date?: string;
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
    // specialties = "", // later
    categories,
    gender,
    rate,
    minCost,
    maxCost,
    date,
    time,
  } = await searchParams;

  // specialties list
  const specialtiesList = await fetchSpecialties();

  // time & date
  const { iso } = timeZone();

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
          {/* time picker */}
          <Appointment initialDate={iso} />

          {/* consultant list */}
          <Suspense
            key={`${search}-${page}-${gender}-${rate}-${date}-${time}-${maxCost}-${minCost}`}
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
              // specialties={specialties}
              orderby={orderby}
              categories={categories}
              gender={gender}
              rate={rate}
              minCost={minCost}
              maxCost={maxCost}
              date={date}
              time={time}
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
  orderby,
  categories,
  gender,
  rate,
  minCost,
  maxCost,
  time,
  date,
  // specialties,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get articles
  const data = await getConsultants(
    safe,
    search,
    orderby,
    categories?.split(","),
    gender?.split(","),
    rate,
    minCost,
    maxCost,
    date,
    time,
    // specialties?.split(",")
  );

  return (
    <>
      <Consultants consultants={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
