// React & Next
import { Metadata } from "next";
import { notFound } from "next/navigation";

// components
import { CenterInfo } from "@/components/clients/centers/center-info";
import { CenterShell } from "@/components/clients/centers/center-shell";
import { CenterHeader } from "@/components/clients/centers/center-header";
import { CenterConsultantCard } from "@/components/clients/centers/center-consultant-card";

// center data
import {
  fetchCenterConsultants,
  fetchPublishedCenter,
  resolveCenter,
} from "./center";

// constants
import { mainRoute } from "@/constants/links";

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

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveCenter(slug);
  if (!resolved) notFound();

  const { center, preview } = resolved;
  const consultants = await fetchCenterConsultants(center.ceid);

  return (
    <CenterShell
      themeKey={center.themeKey}
      themeVars={center.themeVars}
      preview={preview}
    >
      <CenterHeader center={center} />

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
        <CenterInfo center={center} />

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-900">مستشارو المركز</h2>
          {consultants.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              لا يوجد مستشارون متاحون حالياً
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {consultants.map((c) => (
                <CenterConsultantCard key={c.cid} consultant={c} slug={center.slug} />
              ))}
            </div>
          )}
        </section>
      </div>
    </CenterShell>
  );
}
