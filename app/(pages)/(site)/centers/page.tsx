// React & Next
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

// components
import { CenterCard } from "@/components/clients/centers/center-card";
import { CentersFilter } from "@/components/clients/centers/centers-filter";
import { IconSquare } from "@/components/clients/centers/icon-square";

// prisma data
import { getPublishedCenters } from "@/data/center/centers";

// lib
import { centersSearchParamsCache } from "@/lib/nuqs/centers";

// constants
import { mainRoute } from "@/constants/links";

// icons
import { Building2 } from "lucide-react";

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
      <header className="flex items-start gap-4">
        <IconSquare icon={Building2} tone="neutral" className="size-11 rounded-2xl" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">المراكز</h1>
          <p className="max-w-xl leading-7 text-muted-foreground">
            مراكز استشارية معتمدة، لكل مركز فريقه من المستشارين. اختر المركز
            واحجز جلستك بسهولة.
          </p>
        </div>
      </header>

      <CentersFilter cities={cities} />

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/50 p-12 text-center">
          <IconSquare icon={Building2} tone="neutral" />
          <p className="text-sm text-muted-foreground">لا توجد مراكز متاحة حالياً</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <CenterCard key={c.ceid} center={c} />
          ))}
        </div>
      )}
    </div>
  );
}
