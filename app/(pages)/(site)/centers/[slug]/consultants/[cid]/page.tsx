// React & Next
import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

// components
import { CenterShell } from "@/components/clients/centers/center-shell";
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

  const { center, preview } = resolved;
  const consultant = await fetchCenterConsultant(center.ceid, cidN);
  if (!consultant) notFound();

  return (
    <CenterShell
      themeKey={center.themeKey}
      themeVars={center.themeVars}
      preview={preview}
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CenterConsultantProfile
            consultant={consultant}
            center={{ slug: center.slug, name: center.name }}
          />
        </div>
        <div className="lg:col-span-2">
          {/* prices and slots are live, never cached */}
          <Suspense
            fallback={
              <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
            }
          >
            <BookingSection cid={consultant.cid} />
          </Suspense>
        </div>
      </div>
    </CenterShell>
  );
}
