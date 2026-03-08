// React & Next
import { Metadata } from "next";
import React, { Suspense } from "react";

// components
import Filter, {
  FilterContent,
} from "@/components/clients/event/discounts/filter";
import Consultants from "@/components/clients/event/discounts/list";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Navigation from "@/components/clients/event/discounts/navigation";

// prisma data
import { getDiscountConsultants } from "@/data/discounts";

// constants
import { mainRoute } from "@/constants/links";
import EventHeader from "@/components/clients/event/header";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - عرض حصري | جلسة بـ 89 ريال شامل الضريبة",
  description:
    "احصل على جلسة استشارية متخصصة بسعر حصري 89 ريال شامل الضريبة. مستشارون نفسيون وأسريون وقانونيون موثوقون بسرية تامة عبر منصة شاورني.",
  keywords: [
    "عرض شاورني",
    "خصم استشارة",
    "جلسة 89 ريال",
    "عرض حصري",
    "استشارة بسعر مخفض",
    "مستشار نفسي",
    "مستشار أسري",
    "استشارات نفسية",
    "استشارات أسرية",
    "جلسات نفسية",
    "منصة استشارات سعودية",
    "استشارة فورية",
    "خصم استشارة نفسية",
  ],
  openGraph: {
    title: "شاورني - عرض حصري | جلسة بـ 89 ريال شامل الضريبة",
    type: "website",
    url: `${mainRoute}/event`,
    siteName: "شاورني - العرض الحصري",
    description:
      "احصل على جلسة استشارية متخصصة بسعر حصري 89 ريال شامل الضريبة. مستشارون نفسيون وأسريون وقانونيون موثوقون بسرية تامة عبر منصة شاورني.",
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
    title: "شاورني - عرض حصري | جلسة بـ 89 ريال شامل الضريبة",
    description:
      "احصل على جلسة استشارية متخصصة بسعر حصري 89 ريال شامل الضريبة. مستشارون نفسيون وأسريون وقانونيون موثوقون بسرية تامة عبر منصة شاورني.",
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
  categories?: string;
  gender?: string;
};

// interface
interface Props {
  searchParams: Promise<FilterParams>;
}

export default async function Page({ searchParams }: Props) {
  // params
  const { search = "", page = "1", categories, gender } = await searchParams;

  return (
    <div>
      {/* articles headers */}
      <EventHeader />

      <div className="md:grid grid-cols-5 space-y-5 pb-5">
        {/* side filters */}
        <Filter>
          <FilterContent />
        </Filter>

        {/* content */}
        <div className="col-span-4">
          {/* consultant list */}
          <Suspense
            key={`${search}-${page}-${gender}`}
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
              categories={categories}
              gender={gender}
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
  categories,
  gender,
  // specialties,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get articles
  const data = await getDiscountConsultants(
    3,
    safe,
    search,
    categories?.split(","),
    gender?.split(","),
  );

  return (
    <>
      <Consultants consultants={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
