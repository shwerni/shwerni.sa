// React & Next
import { Metadata } from "next";
import React, { Suspense } from "react";

// React & Next
import Image from "next/image";
// components
import Filter, {
  FilterContent,
} from "@/components/clients/sub-pages/event/discounts/filter";
import Consultants from "@/components/clients/sub-pages/event/discounts/list";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Navigation from "@/components/clients/sub-pages/event/discounts/navigation";

// prisma data
import { getDiscountConsultants } from "@/data/discounts";

// constants
import { mainRoute } from "@/constants/links";

// national day event — free-session discount
const EVENT_DISCOUNT_ID = 6;

// meta data seo
const title = "شاورني | عرض اليوم الوطني 96: جلستك الاستشارية بـ 96 ريال فقط";
const description =
  "احتفالاً باليوم الوطني السعودي الـ 96، احجز جلستك الاستشارية الآن مع أي مستشار في منصة شاورني بـ 96 ريال فقط. بادر بالحجز، العرض لفترة محدودة!";
const url = `${mainRoute}event`;
const og = {
  url: `${mainRoute}other/event/banner.png`,
  alt: "شاورني - عرض اليوم الوطني 96",
  type: "image/png",
  width: 1200,
  height: 630,
};

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "اليوم الوطني السعودي 96",
    "عروض اليوم الوطني 96",
    "عرض 96 ريال",
    "استشارة ب 96 ريال",
    "عروض شاورني",
    "منصة استشارات سعودية",
    "مستشار نفسي",
    "مستشار أسري",
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    type: "website",
    url,
    siteName: "شاورني",
    locale: "ar_SA",
    images: [og],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@shwernisa",
    images: [og],
  },
  icons: `${mainRoute}favicon.ico`,
};

// filter data
type FilterParams = {
  search?: string;
  page?: string;
  categories?: string;
  gender?: string;
};

interface Props {
  searchParams: Promise<FilterParams>;
}

export default async function Page({ searchParams }: Props) {
  const { search = "", page = "1", categories, gender } = await searchParams;

  return (
    <div>
      <EventBanner />

      <div className="md:grid grid-cols-5 space-y-5 py-5">
        <Filter>
          <FilterContent />
        </Filter>

        <div className="col-span-4">
          <Suspense
            key={`${search}-${page}-${gender}-${categories}`}
            fallback={
              <CardSkeleton
                count={9}
                CardClassName="h-64 w-44"
                className="..."
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
  search = "",
  page,
  categories,
  gender,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // consultants in the free discount, excluding those who hit the daily cap
  const data = await getDiscountConsultants(
    EVENT_DISCOUNT_ID,
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

const EventBanner = () => {
  return (
    <div className="relative w-full aspect-square sm:aspect-video overflow-hidden">
      {/* mobile */}
      <Image
        src="/other/event/banner-mobile.png"
        alt="عرض شاورني بمناسبة اليوم الوطني السعودي"
        priority
        fetchPriority="high"
        fill
        className="object-cover sm:hidden"
        sizes="100vw"
      />

      {/* desktop */}
      <Image
        src="/other/event/banner.png"
        alt="عرض شاورني بمناسبة اليوم الوطني السعودي"
        priority
        fetchPriority="high"
        fill
        className="hidden sm:block object-cover"
        sizes="100vw"
      />
    </div>
  );
};
