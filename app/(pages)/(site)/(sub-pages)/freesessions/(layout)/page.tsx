// React & Next
import { Metadata } from "next";

// componenets

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// constants
import UnavailableService from "@/components/shared/unavailable-service";
import { mainRoute } from "@/constants/links";
import { timeZone } from "@/lib/site/time";
import { getDate, getDay } from "date-fns";
import Filter, {
  FilterContent,
} from "@/components/clients/freesessions/filter";
import { Suspense } from "react";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import FreeSessions from "@/components/clients/freesessions/list";
import Navigation from "@/components/clients/freesessions/navigation";
import { getFreeSessionConsultants } from "@/data/freesession";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الجلسات المجانية | Free Sessions - Shwerni",
  description:
    "احجز جلسة مجانية مع مستشار الآن عبر شاورني. Free session booking with a consultant via Shwerni.",
  keywords: [
    "جلسة مجانية",
    "استشارة مجانية",
    "شاورني",
    "مستشار مجاني",
    "مستشار نفسي",
    "استشارات أسرية",
    "شاورني الجلسات المجانية",
    "shwerni",
    "free session",
    "consultants",
    "therapy",
    "mental health",
  ],
  openGraph: {
    title: "شاورني - الجلسات المجانية | Free Sessions - Shwerni",
    type: "website",
    url: `${mainRoute}/freesession`,
    siteName: "Shwerni.sa",
    description:
      "احجز جلسة مجانية مع مستشار الآن عبر شاورني. Free session booking with a consultant via Shwerni.",
    images: [
      {
        url: `${mainRoute}other/freesession.png`,
        alt: "Shwerni Free Sessions - الجلسات المجانية",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شاورني - الجلسات المجانية | Free Sessions - Shwerni",
    description:
      "احجز جلسة مجانية مع مستشار الآن عبر شاورني. Free session booking with a consultant via Shwerni.",
    creator: "@shwernisa",
    images: [
      {
        url: `${mainRoute}other/freesession.png`,
        alt: "Shwerni Free Sessions - الجلسات المجانية",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: `${mainRoute}favicon.ico`,
};

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

// default
export default async function Page({ searchParams }: Props) {
  // params
  const { search = "", page = "1", categories, gender } = await searchParams;

  // check if today if first friday
  const { iso } = timeZone();

  // check date and day
  const dayOfWeek = getDay(iso);
  const dayOfMonth = getDate(iso);

  // is first friday
  const status = dayOfWeek === 5 && dayOfMonth <= 7;


  return !status ? (
    <UnavailableService
      title="جلسة التعريفية المجانية"
      header="جرّب شاورني مجانًا"
      description="ابدأ جلستك التعريفية المجانية مع أحد مستشارينا لتتعرف على المنصة وتكتشف كيف يمكننا دعمك، دون أي التزام مالي."
      day={Weekday.FRIDAY}
    />
  ) : (
    <div>
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
            <FreeSessionsList
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

const FreeSessionsList = async ({
  search,
  page,
  categories,
  gender,
  // specialties,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get consultant temp
  const data = await getFreeSessionConsultants(
    safe,
    search,
    categories?.split(","),
    gender?.split(","),
  );

  return (
    <>
      <FreeSessions consultants={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
