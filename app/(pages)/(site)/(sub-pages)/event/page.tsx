// React & Next
import { Metadata } from "next";
import React, { Suspense } from "react";

// components
import Filter, {
  FilterContent,
} from "@/components/clients/event/discounts/filter";
import EventHeader from "@/components/clients/event/header";
import Consultants from "@/components/clients/event/discounts/list";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Navigation from "@/components/clients/event/discounts/navigation";

// prisma data
import { getDiscountConsultants } from "@/data/discounts";

// constants
import { mainRoute } from "@/constants/links";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - العروض والخصومات | ترقب أحدث العروض الحصرية",
  description:
    "صفحة العروض الحصرية من منصة شاورني. ترقب أحدث العروض والخصومات على جلسات الاستشارة النفسية والأسرية والمهنية بأسعار مميزة.",
  keywords: [
    "عروض شاورني",
    "خصومات استشارة",
    "عروض حصرية قادمة",
    "تخفيضات استشارة نفسية",
    "عروض استشارة أسرية",
    "منصة استشارات سعودية",
    "مستشار نفسي",
    "مستشار أسري",
    "استشارات بسعر مخفض",
  ],
  openGraph: {
    title: "شاورني - العروض والخصومات | ترقب أحدث العروض الحصرية",
    type: "website",
    url: `${mainRoute}/event`,
    siteName: "شاورني - العروض الحصرية",
    description:
      "صفحة العروض الحصرية من منصة شاورني. ترقب أحدث العروض والخصومات على جلسات الاستشارة النفسية والأسرية والمهنية بأسعار مميزة.",
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
    title: "شاورني - العروض والخصومات | ترقب أحدث العروض الحصرية",
    description:
      "صفحة العروض الحصرية من منصة شاورني. ترقب أحدث العروض والخصومات على جلسات الاستشارة النفسية والأسرية والمهنية بأسعار مميزة.",
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

  // no event
  // return <NoActiveEvents />;

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

const NoActiveEvents = () => {
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center px-6 py-20 lg:py-32 rounded overflow-hidden mx-auto my-0"
      style={{
        background:
          "linear-gradient(135deg, #020d1a 0%, #0a2540 40%, #0d3d6e 70%, #0f5ca3 100%)",
        minHeight: "420px",
      }}
    >
      {/* noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height%3D'100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* orb top-right */}
      <div
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "#117ed8" }}
      />
      {/* orb bottom-left */}
      <div
        className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ background: "#06b6d4" }}
      />

      {/* shimmer top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, #117ed8, #06b6d4, transparent)",
        }}
      />
      {/* shimmer bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, #117ed8, #06b6d4, transparent)",
        }}
      />

      {/* icon */}
      <div
        className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{
          background: "rgba(17,126,216,0.15)",
          border: "1px solid rgba(17,126,216,0.35)",
        }}
      >
        <span className="text-4xl">🎁</span>
      </div>

      {/* badge */}
      <div
        className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-5"
        style={{
          background: "rgba(17,126,216,0.2)",
          color: "#7dd3fc",
          border: "1px solid rgba(17,126,216,0.35)",
        }}
      >
        <span>📢</span>
        <span>عروض شاورني الحصرية</span>
      </div>

      {/* heading */}
      <h2
        className="relative z-10 text-2xl lg:text-4xl font-semibold mb-4"
        style={{ color: "#f0f9ff" }}
      >
        لا توجد عروض نشطة حالياً
      </h2>

      {/* subtext */}
      <p
        className="relative z-10 max-w-md text-sm lg:text-base font-medium mb-8"
        style={{ color: "#bae6fd", lineHeight: "2" }}
      >
        نعمل على إعداد عروض حصرية مميزة لك. تابعنا وكن أول من يعلم بأحدث
        التخفيضات على جلسات الاستشارة النفسية والأسرية والمهنية.
      </p>

      {/* divider */}
      <div
        className="relative z-10 w-24 h-px mb-8"
        style={{
          background:
            "linear-gradient(90deg, transparent, #117ed8, transparent)",
        }}
      />

      {/* follow hint */}
      <div
        className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
        style={{
          background: "rgba(17,126,216,0.2)",
          border: "1px solid rgba(17,126,216,0.35)",
          color: "#e0f2fe",
        }}
      >
        <span>🔔</span>
        <span>تابع حساباتنا لتصلك العروض فور إطلاقها</span>
      </div>
    </div>
  );
};

// export const metadata: Metadata = {
//   title: "شاورني - عرض حصري | جلسة بـ 89 ريال شامل الضريبة",
//   description:
//     "احصل على جلسة استشارية متخصصة بسعر حصري 89 ريال شامل الضريبة. مستشارون نفسيون وأسريون وقانونيون موثوقون بسرية تامة عبر منصة شاورني.",
//   keywords: [
//     "عرض شاورني",
//     "خصم استشارة",
//     "جلسة 89 ريال",
//     "عرض حصري",
//     "استشارة بسعر مخفض",
//     "مستشار نفسي",
//     "مستشار أسري",
//     "استشارات نفسية",
//     "استشارات أسرية",
//     "جلسات نفسية",
//     "منصة استشارات سعودية",
//     "استشارة فورية",
//     "خصم استشارة نفسية",
//   ],
//   openGraph: {
//     title: "شاورني - عرض حصري | جلسة بـ 89 ريال شامل الضريبة",
//     type: "website",
//     url: `${mainRoute}/event`,
//     siteName: "شاورني - العرض الحصري",
//     description:
//       "احصل على جلسة استشارية متخصصة بسعر حصري 89 ريال شامل الضريبة. مستشارون نفسيون وأسريون وقانونيون موثوقون بسرية تامة عبر منصة شاورني.",
//     images: [
//       {
//         url: `${mainRoute}other/owners.jpeg`,
//         alt: "shwerni",
//         type: "image/jpg",
//         width: 1200,
//         height: 630,
//       },
//     ],
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "شاورني - عرض حصري | جلسة بـ 89 ريال شامل الضريبة",
//     description:
//       "احصل على جلسة استشارية متخصصة بسعر حصري 89 ريال شامل الضريبة. مستشارون نفسيون وأسريون وقانونيون موثوقون بسرية تامة عبر منصة شاورني.",
//     creator: "@shwernisa",
//     images: [
//       {
//         url: `${mainRoute}other/owners.jpeg`,
//         alt: "shwerni",
//         type: "image/jpg",
//         width: 1200,
//         height: 630,
//       },
//     ],
//   },
//   icons: `${mainRoute}favicon.ico`,
// };
