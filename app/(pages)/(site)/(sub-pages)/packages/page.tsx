// React & Next
import { Suspense } from "react";
import type { Metadata } from "next";

// nuqs server
import { packagesCache } from "@/lib/nuqs/packages";

// components
import RequestTime from "@/components/shared/request-time";
import { Skeleton } from "@/components/ui/skeleton";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import { PackagesEmpty } from "@/components/clients/packages/empty";
import { PackageCard } from "@/components/clients/packages/package-card";
import { PackagesFilters } from "@/components/clients/packages/filters";
import { PackagesNavigation } from "@/components/clients/packages/navigation";
import { ConsultantPackagesCard } from "@/components/clients/packages/consultant-packages-card";

// prisma data
import {
  getPublicPackageConsultants,
  getPublicPackages,
  PublicPackagesFilters,
} from "@/data/packages";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";
import { PackageView } from "@/constants/packages";

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني"
const title = "الباقات التوفيرية";
const fullTitle = `${title} | شاورني`;
const description =
  "باقات جلسات توفيرية مع مستشارين موثوقين في شاورني: قارن الباقات حسب عدد الجلسات والسعر والتخصص واحجز باقتك بسعر أقل من الحجز الفردي.";
const url = `${mainRoute}packages`;
const ogImage = {
  url: `${mainRoute}meta/packages.png`,
  alt: fullTitle,
  type: "image/jpeg",
  width: 1200,
  height: 630,
};

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "باقات",
    "باقات جلسات",
    "باقات توفيرية",
    "باقات استشارات",
    "جلسات نفسية",
    "استشارات أسرية",
    "مستشار نفسي",
    "شاورني",
  ],
  // the same canonical for every search, filter, sort and page combination
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

// props
interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: Props) {

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-10 space-y-8">
      {/* header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500">
          جلسات أكثر بسعر أقل من الحجز الفردي، جميع جلسات الباقات مدتها 45 دقيقة
        </p>
      </div>

      {/* filters: they read the url (request data), so they stream in; the placeholder keeps
          their height */}
      <Suspense fallback={<Skeleton className="h-36 w-full" />}>
        <RequestTime searchParams={searchParams}>
          <PackagesFilters />
        </RequestTime>
      </Suspense>

      {/* results: the search params are read inside suspense, so the header stays in the
          prerendered shell; re-suspends on every filter change */}
      <Suspense fallback={listSkeleton}>
        <PackagesResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// list skeleton, shown on the first load and on every filter change
const listSkeleton = (
  <CardSkeleton
    count={6}
    CardClassName="w-full"
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
  />
);

async function PackagesResults({ searchParams }: Props) {
  const { view, ...filters } = await packagesCache.parse(searchParams);

  return (
    <Suspense key={JSON.stringify({ view, ...filters })} fallback={listSkeleton}>
      <PackagesList view={view} filters={filters} />
    </Suspense>
  );
}

async function PackagesList({
  view,
  filters,
}: {
  view: PackageView;
  filters: PublicPackagesFilters;
}) {
  const filtered =
    !!filters.search ||
    filters.category.length > 0 ||
    filters.gender.length > 0 ||
    filters.sessions.length > 0;

  if (view === "consultants") {
    const data = await getPublicPackageConsultants(filters);
    if (!data.items.length)
      return <PackagesEmpty search={filters.search} filtered={filtered} />;

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((item) => (
            <ConsultantPackagesCard key={item.cid} item={item} />
          ))}
        </div>
        <PackagesNavigation
          current={data.page}
          pages={data.pages}
          total={data.total}
          label="عدد المستشارين"
        />
      </>
    );
  }

  const data = await getPublicPackages(filters);
  if (!data.items.length)
    return <PackagesEmpty search={filters.search} filtered={filtered} />;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.items.map((item) => (
          <PackageCard key={item.id} item={item} />
        ))}
      </div>
      <PackagesNavigation
        current={data.page}
        pages={data.pages}
        total={data.total}
        label="عدد الباقات"
      />
    </>
  );
}
