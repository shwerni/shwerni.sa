// React & Next
import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

// components
import { CenterHero } from "@/components/clients/centers/center-hero";
import { CenterAbout } from "@/components/clients/centers/center-about";
import { CenterHours } from "@/components/clients/centers/center-hours";
import { IconSquare } from "@/components/clients/centers/icon-square";
import {
  CardGridSkeleton,
  QuickInfoSkeleton,
} from "@/components/clients/centers/skeletons";
import { CenterLocation } from "@/components/clients/centers/center-location";
import { CenterAmenities } from "@/components/clients/centers/center-amenities";
import { CenterQuickInfo } from "@/components/clients/centers/center-quick-info";
import { CenterConsultantCard } from "@/components/clients/centers/center-consultant-card";

// prisma data
import type { PublicCenter } from "@/data/center/centers";

// center data
import {
  fetchCenterConsultants,
  fetchPublishedCenter,
  resolveCenter,
} from "./center";

// constants
import { mainRoute } from "@/constants/links";

// icons
import { Users } from "lucide-react";

// props
interface Props {
  params: Promise<{ slug: string }>;
}

// seo: published centers only; anything else (missing, hidden, admin preview) is noindex
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const center = await fetchPublishedCenter(slug);
  if (!center) return { robots: { index: false, follow: false } };

  const description =
    center.description?.slice(0, 160) ||
    `احجز جلستك مع مستشاري ${center.name} في ${center.city} عبر شاورني.`;

  return {
    title: center.name,
    description,
    alternates: { canonical: `${mainRoute}centers/${center.slug}` },
    openGraph: {
      title: center.name,
      description,
      ...(center.cover || center.logo
        ? { images: [{ url: (center.cover || center.logo) as string }] }
        : {}),
    },
  };
}

// the consultant grid streams in with its own skeleton
async function ConsultantsGrid({ ceid, slug }: { ceid: number; slug: string }) {
  const consultants = await fetchCenterConsultants(ceid);

  if (consultants.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/50 p-10 text-center">
        <IconSquare icon={Users} tone="neutral" />
        <p className="text-sm text-muted-foreground">
          لا يوجد مستشارون متاحون حالياً
        </p>
      </div>
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {consultants.map((c) => (
        <CenterConsultantCard key={c.cid} consultant={c} slug={slug} />
      ))}
    </div>
  );
}

// inline quick facts in the hero; the consultant count streams with the grid's cached list
async function QuickInfo({ center }: { center: PublicCenter }) {
  const consultants = await fetchCenterConsultants(center.ceid);
  return (
    <CenterQuickInfo
      workDays={center.workHours.map((h) => h.day)}
      consultants={consultants.length}
    />
  );
}

// order: hero (who + how to book) → consultants (the main content) → compact info
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveCenter(slug);
  if (!resolved) notFound();

  const { center } = resolved;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-4">
      <CenterHero
        center={center}
        chips={
          <Suspense fallback={<QuickInfoSkeleton />}>
            <QuickInfo center={center} />
          </Suspense>
        }
      />

      <section id="consultants" className="scroll-mt-24 space-y-4">
        <h2 className="text-lg font-semibold">اختر مستشارك</h2>
        <Suspense fallback={<CardGridSkeleton count={3} />}>
          <ConsultantsGrid ceid={center.ceid} slug={center.slug} />
        </Suspense>
      </section>

      <div className="grid gap-x-12 gap-y-10 border-t border-border/60 pt-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CenterAbout description={center.description} policy={center.policy} />
        </div>
        <div className="flex flex-col gap-8">
          <CenterLocation address={center.address} lat={center.lat} lng={center.lng} />
          <CenterHours hours={center.workHours} />
          <CenterAmenities amenities={center.amenities} />
        </div>
      </div>
    </div>
  );
}
