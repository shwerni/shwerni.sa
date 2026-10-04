// React & Next
import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

// components
import { BookingPanelSkeleton } from "@/components/clients/centers/skeletons";
import { BookingSection } from "@/components/clients/centers/booking/booking-section";
import { CenterConsultantProfile } from "@/components/clients/centers/center-consultant-profile";

// center data
import {
  fetchCenterConsultant,
  fetchPublishedCenter,
  resolveCenter,
} from "../../center";

// constants
import { mainRoute } from "@/constants/links";

// props
interface Props {
  params: Promise<{ slug: string; cid: string }>;
}

// seo: a consultant of a published center only; anything else is noindex
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, cid } = await params;
  const center = await fetchPublishedCenter(slug);
  const consultant = center
    ? await fetchCenterConsultant(center.ceid, Number(cid))
    : null;
  if (!center || !consultant) return { robots: { index: false, follow: false } };

  const title = `${consultant.name} — ${center.name}`;
  const description = `احجز جلستك مع ${consultant.name}، ${consultant.title}، في ${center.name} عبر شاورني.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${mainRoute}centers/${center.slug}/consultants/${consultant.cid}`,
    },
    openGraph: {
      title,
      description,
      ...(consultant.image ? { images: [{ url: consultant.image }] } : {}),
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug, cid } = await params;
  const cidN = Number(cid);

  // the center must be visible (or an admin preview), and the consultant must belong to it
  // and be published + approved, otherwise 404
  const resolved = await resolveCenter(slug);
  if (!resolved || !Number.isInteger(cidN)) notFound();

  const { center } = resolved;
  const consultant = await fetchCenterConsultant(center.ceid, cidN);
  if (!consultant) notFound();

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 pb-10 lg:grid-cols-[1fr_380px] lg:pb-16">
      <CenterConsultantProfile
        consultant={consultant}
        center={{ slug: center.slug, name: center.name }}
      />
      <div className="lg:sticky lg:top-20 lg:self-start">
        {/* prices and slots are live, never cached */}
        <Suspense fallback={<BookingPanelSkeleton />}>
          <BookingSection cid={consultant.cid} />
        </Suspense>
      </div>
    </div>
  );
}
