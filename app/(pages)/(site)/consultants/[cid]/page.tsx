// React & Next
import { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

// components
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import CollaborationBadge from "@/components/shared/collaboration-badge";
import Consultant from "@/components/clients/consultants/consultant/consultant";
import ConsultantReviews from "@/components/clients/consultants/consultant/reviews";
// import AddYourReview from "@/components/clients/consultants/consultant/post-review";
import ConsultantReserve from "@/components/clients/consultants/reservation/reserve";
import SkeletonConsultant from "@/components/clients/consultants/consultant/skeleton";
import SkeletonCoupons from "@/components/clients/consultants/consultant/coupons/skeleton";
import ConsultantCoupons from "@/components/clients/consultants/consultant/coupons/coupons";

// prisma data
import { getConsultantInfo } from "@/data/consultant";

// prisma types
import {
  ApprovalState,
  ConsultantState,
  Gender,
} from "@/lib/generated/prisma/client";

// seo
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbList } from "@/components/seo/breadcrumbs";
import { organizationId } from "@/components/seo/site-json-ld";

// utils
import { findCategory } from "@/utils";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";

// props
type Props = {
  params: Promise<{ cid: string }>;
  searchParams: Promise<{
    collaboration?: string;
  }>;
};

// cache meta data
const getCachedConsultant = async (cid: number) => {
  "use cache";
  cacheLife("hours");
  return getConsultantInfo(cid);
};

// guard — reuse across metadata + page
const isConsultantVisible = (
  consultant: Awaited<ReturnType<typeof getCachedConsultant>>,
): consultant is NonNullable<typeof consultant> =>
  !!consultant &&
  consultant.approved === ApprovalState.APPROVED &&
  consultant.statusA === ConsultantState.PUBLISHED &&
  !!consultant.status;

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني".
// a consultant the page hides (404) gets no metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cid } = await params;
  const cidN = Number(cid);
  const consultant = await getCachedConsultant(cidN);

  if (!isConsultantVisible(consultant)) return {};

  const { fullName, specialty, image, url } = consultantSeo(consultant, cidN);
  const title = specialty ? `${fullName} — ${specialty}` : fullName;
  const description = `احجز جلساتك مع ${fullName}${specialty ? `، ${specialty}،` : ""} عبر شاورني بسرية تامة وأسعار مناسبة، في أي وقت ومن أي مكان.`;
  const ogImage = { url: image, alt: `صورة ${fullName}` };

  return {
    title,
    description,
    keywords: [
      consultant.name ?? "",
      "مستشار نفسي",
      "مستشار أسري",
      "علاج نفسي",
      "therapy",
      "online therapy",
      "mental health support",
      "family counseling",
      "Saudi therapy",
    ],
    // the clean url: query params (e.g. ?collaboration=) never reach the canonical
    alternates: { canonical: url },
    openGraph: {
      ...defaultMetaApi.openGraph,
      type: "profile",
      title: `${title} | شاورني`,
      description,
      url,
      images: [ogImage],
    },
    twitter: {
      ...defaultMetaApi.twitter,
      title: `${title} | شاورني`,
      description,
      images: [ogImage],
    },
  };
}

// name, specialty (the category label the profile shows), image and clean url, shared by
// the metadata and the json-ld
const consultantSeo = (
  consultant: NonNullable<Awaited<ReturnType<typeof getCachedConsultant>>>,
  cid: number,
) => {
  const isMale = consultant.gender === Gender.MALE;
  const genderLabel = isMale ? "المستشار" : "المستشارة";
  const image = consultant.image?.trim()
    ? consultant.image
    : `${mainRoute}layout/${isMale ? "male" : "female"}.jpg`;

  return {
    name: consultant.name ?? "",
    fullName: `${genderLabel} ${consultant.name ?? ""}`,
    specialty: findCategory(consultant.category)?.label,
    image,
    url: `${mainRoute}consultants/${cid}`,
  };
};

// return
const Page = async ({ params, searchParams }: Props) => {
  // cid & collaboration
  const [{ cid }, { collaboration }] = await Promise.all([
    params,
    searchParams,
  ]);

  // parse cid as number
  const cidN = Number(cid);

  // consultant
  const consultant = await getCachedConsultant(cidN);

  // a hidden or missing consultant answers 404 (the site not-found page)
  if (!isConsultantVisible(consultant)) notFound();

  // structured data: the consultant and the breadcrumb trail
  const seo = consultantSeo(consultant, cidN);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": `${seo.url}#person`,
              name: seo.name,
              ...(seo.specialty && { jobTitle: seo.specialty }),
              image: seo.image,
              url: seo.url,
              worksFor: { "@id": organizationId },
            },
            breadcrumbList([
              { name: "المستشارون", path: "consultants" },
              { name: seo.name, path: `consultants/${cidN}` },
            ]),
          ],
        }}
      />
      <div className="space-y-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 space-y-6">
          <Suspense fallback={<SkeletonConsultant />}>
            <Consultant cid={cidN} />
          </Suspense>
          <Suspense fallback={<SkeletonCoupons />}>
            <ConsultantCoupons cid={cidN} />
          </Suspense>
        </div>
        {/* reservation */}
        <Suspense fallback={<CardSkeleton count={1} className="w-full" />}>
          {consultant.status && (
            <ConsultantReserve cid={cidN} collaboration={collaboration} />
          )}
        </Suspense>
        {/* reviews */}
        <div className="max-w-6xl mx-auto px-4 sm:px-5 space-y-6 mb-10">
          <Suspense
            fallback={
              <CardSkeleton count={4} className="flex flex-col gap-4" />
            }
          >
            <ConsultantReviews cid={cidN} />
          </Suspense>
        </div>
        {/* collaboration */}
        {collaboration && (
          <Suspense fallback={null}>
            <CollaborationBadge collaboration={collaboration} />
          </Suspense>
        )}
      </div>
    </>
  );
};

export default Page;
