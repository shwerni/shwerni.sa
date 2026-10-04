// React & Next
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

// components
import { CenterCard } from "@/components/clients/centers/center-card";
import { CentersFilter } from "@/components/clients/centers/centers-filter";

// prisma data
import { getPublishedCenters } from "@/data/center/centers";

// lib
import { centersSearchParamsCache } from "@/lib/nuqs/centers";

// constants
import { mainRoute } from "@/constants/links";

// seo
export const metadata: Metadata = {
  title: "المراكز",
  description:
    "مراكز الاستشارات الأسرية والنفسية على شاورني: احجز جلستك مع مستشاري المركز أونلاين.",
  alternates: { canonical: `${mainRoute}centers` },
};

// props
interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// published centers (purged by the "centers" tag)
async function fetchCenters() {
  "use cache";
  cacheTag("centers");
  cacheLife("hours");
  return getPublishedCenters();
}

export default async function Page({ searchParams }: Props) {
  const { city } = await centersSearchParamsCache.parse(searchParams);
  const centers = await fetchCenters();

  // cities from the published centers themselves
  const cities = [...new Set(centers.map((c) => c.city))].sort((a, b) =>
    a.localeCompare(b, "ar"),
  );
  const shown = city ? centers.filter((c) => c.city === city) : centers;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold text-slate-900">المراكز</h1>
        <p className="max-w-xl leading-7 text-slate-600">
          مراكز استشارية معتمدة، لكل مركز فريقه من المستشارين. اختر المركز
          واحجز جلستك بسهولة.
        </p>
      </header>

      <CentersFilter cities={cities} />

      {shown.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
          لا توجد مراكز متاحة حالياً
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <CenterCard key={c.ceid} center={c} />
          ))}
        </div>
      )}
    </div>
  );
}
