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

// meta data seo
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cid } = await params;
  const consultant = await getCachedConsultant(Number(cid));

  if (consultant?.approved !== ApprovalState.APPROVED) return {};

  const isMale = consultant.gender === Gender.MALE;
  const image = consultant.image?.trim()
    ? consultant.image
    : `${mainRoute}layout/${isMale ? "male" : "female"}.jpg`;

  const fullName = `${isMale ? "المستشار" : "المستشارة"} ${consultant.name ?? ""}`;
  const title = `شاورني - ${fullName}`;
  const description = `شاورني - ${fullName} احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.`;
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
      "المستشارون",
      "المستشارين",
      "مستشارين",
      "مستشار",
      "مستشار نفسي",
      "مستشار أسري",
      "علاج نفسي",
      "therapy",
      "online therapy",
      "mental health support",
      "family counseling",
      "relationship advice",
      "Saudi therapy",
      "platform",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `${mainRoute}/consultant/${cid}`,
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
  // cid
  const { cid } = await params;

  // collaboration
  const { collaboration } = await searchParams;

  // parse cid as number
  const cidN = Number(cid);

  // consultant
  const consultant = await getCachedConsultant(cidN);

  // if consultant refused, show 404 only
  if (
    !consultant ||
    consultant.approved !== ApprovalState.APPROVED ||
    consultant.statusA !== ConsultantState.PUBLISHED ||
    !consultant.status
  )
    return <Error404 />;

  return (
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
          fallback={<CardSkeleton count={4} className="flex flex-col gap-4" />}
        >
          <ConsultantReviews cid={cidN} />
        </Suspense>
      </div>
      {/* collaboration */}
      {collaboration && (
        <Suspense
          fallback={
            <CardSkeleton
              count={1}
              className="fixed bottom-6 left-6 z-50 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-3 transition-all hover:scale-[1.03]"
            />
          }
        >
          <CollaborationBadge collaboration={collaboration} />
        </Suspense>
      )}
    </div>
  );
};

export default Page;
