// React & Next
import { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import Error404 from "@/components/shared/error-404";
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

// constants
import { mainRoute } from "@/constants/links";

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

// meta data seo
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cid } = await params;
  const consultant = await getCachedConsultant(Number(cid));

  if (!isConsultantVisible(consultant)) return {};

  const isMale = consultant.gender === Gender.MALE;
  const genderLabel = isMale ? "المستشار" : "المستشارة";
  const genderImage = isMale ? "male" : "female";

  const image = consultant.image?.trim()
    ? consultant.image
    : `${mainRoute}layout/${genderImage}.jpg`;

  const fullName = `${genderLabel} ${consultant.name ?? ""}`;
  const title = `شاورني - ${fullName}`;
  const description = `احجز جلساتك مع ${fullName} عبر شاورني — دعم نفسي بسرية تامة وأسعار مناسبة، في أي وقت ومن أي مكان.`;

  const ogImage = {
    url: image,
    alt: `صورة ${fullName}`,
    type: "image/jpg",
    width: 1200,
    height: 630,
  };

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
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${mainRoute}consultants/${cid}`,
      siteName: "شاورني | Shwerni",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@shwernisa",
      images: [ogImage],
    },
    icons: `${mainRoute}favicon.ico`,
  };
}

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

  // if consultant refused, show 404 only
  if (!isConsultantVisible(consultant)) return <Error404 />;

  // jsonb object
  const isMale = consultant.gender === Gender.MALE;
  const genderLabel = isMale ? "المستشار" : "المستشارة";
  const image = consultant.image?.trim()
    ? consultant.image
    : `${mainRoute}layout/${isMale ? "male" : "female"}.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${genderLabel} ${consultant.name ?? ""}`,
    image,
    url: `${mainRoute}consultants/${cid}`,
    jobTitle: "مستشار",
    worksFor: {
      "@type": "Organization",
      name: "شاورني",
      url: mainRoute,
    },
    offers: {
      "@type": "Service",
      name: "جلسة استشارية",
      provider: {
        "@type": "Person",
        name: consultant.name ?? "",
      },
      areaServed: "SA",
      availableLanguage: "Arabic",
      url: `${mainRoute}consultants/${cid}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
