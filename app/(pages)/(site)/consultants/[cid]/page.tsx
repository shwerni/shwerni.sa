"use server";
// React & Next
import { Metadata } from "next";
import { Suspense } from "react";

// components
import Error404 from "@/components/shared/error-404";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Consultant from "@/components/clients/consultants/consultant/consultant";
import ConsultantReviews from "@/components/clients/consultants/consultant/reviews";
import ConsultantReserve from "@/components/clients/consultants/reservation/reserve";
import SkeletonConsultant from "@/components/clients/consultants/consultant/skeleton";
import SkeletonCoupons from "@/components/clients/consultants/consultant/coupons/skeleton";
import ConsultantCoupons from "@/components/clients/consultants/consultant/coupons/coupons";

// prisma data
import { getConsultantInfo, getConsultantStates } from "@/data/consultant";
// import { getFavorites } from "@/handlers/clients/favorite";

// prisma types
import {
  ApprovalState,
  ConsultantState,
  Gender,
} from "@/lib/generated/prisma/client";

// constants
import { mainRoute } from "@/constants/links";
import { cacheLife } from "next/cache";

// cache meta data
const getConsultantMetaData = async (cid: number) => {
  "use cache";
  cacheLife("minutes");
  // get consultant
  const consultant = await getConsultantInfo(cid);
  // return
  return consultant;
};

// meta data seo
export async function generateMetadata({
  params,
}: {
  params: Promise<{ cid: string }>;
}): Promise<Metadata> {
  // cid
  const { cid } = await params;

  // get consultant info
  const consultant = await getConsultantMetaData(Number(cid));

  // validate
  if (consultant?.approved !== ApprovalState.APPROVED) return {};

  // image
  const image =
    consultant?.image && consultant.image.trim().length !== 0
      ? consultant.image
      : consultant?.gender === Gender.MALE
        ? `${mainRoute}layout/male.jpg`
        : `${mainRoute}layout/female.jpg`;

  const fullName = `${consultant?.gender === Gender.MALE ? "المستشار" : "المستشارة"} ${consultant?.name ?? ""}`;
  const pageTitle = `شاورني - ${fullName}`;

  return {
    title: pageTitle,
    description: `شاورني - ${fullName} احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.`,

    keywords: [
      consultant?.name ?? "",
      "المستشارون",
      "المستشارين",
      "مستشارين",
      "مشتشار",
      "مستشار نفسي",
      "مستشار أسري",
      "علاج نفسي",
      "therapy",
      "therapy",
      "online therapy",
      "mental health support",
      "family counseling",
      "relationship advice",
      "Saudi therapy",
      "platform",
    ],
    openGraph: {
      title: pageTitle,
      type: "website",
      url: `${mainRoute}/consultant/${cid}`,
      siteName: "شاورني | Shwerni",
      description: `شاورني - ${fullName} احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.`,
      images: [
        {
          url: image,
          alt: `صورة ${fullName}`,
          type: "image/jpg",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: `شاورني - ${fullName} احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.`,
      creator: "@shwernisa",
      images: [
        {
          url: image,
          alt: `shwerni ${fullName}`,
          type: "image/jpg",
          width: 1200,
          height: 630,
        },
      ],
    },
    icons: `${mainRoute}favicon.ico`,
  };
}

// props
type Props = {
  params: Promise<{ cid: string }>;
  searchParams: Promise<{
    collaboration?: string;
  }>;
};

// return
const Page = async ({ params, searchParams }: Props) => {
  // cid
  const { cid } = await params;

  // collaboration
  const { collaboration } = await searchParams;

  // parse cid as number
  const cidN = Number(cid);

  // consultant
  const consultant = await getConsultantStates(cidN);

  // if consultant refused, show 404 only
  if (
    !consultant ||
    consultant.approved !== ApprovalState.APPROVED ||
    consultant.statusA !== ConsultantState.PUBLISHED
  )
    return <Error404 />;

  return (
    <div className="space-y-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 space-y-6">
        <Suspense fallback={<SkeletonConsultant />}>
          <Consultant cid={cidN} collaboration={collaboration} />
        </Suspense>
        <Suspense fallback={<SkeletonCoupons />}>
          <ConsultantCoupons cid={cidN} />
        </Suspense>
        <Suspense
          fallback={<CardSkeleton count={4} className="flex flex-col gap-4" />}
        >
          <ConsultantReviews cid={cidN} />
        </Suspense>
      </div>
      <Suspense fallback={<CardSkeleton count={1} className="w-full" />}>
        {consultant.status && <ConsultantReserve cid={cidN}/>}
      </Suspense>
    </div>
  );
};

export default Page;
