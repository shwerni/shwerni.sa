"use server";
// React & Next
import { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import ProgramReserve from "@/components/clients/programs/reservation/reserve";
import SkeletonConsultant from "@/components/clients/consultants/consultant/skeleton";

// prisma data
import { getProgramInfo } from "@/data/program";

// constants
import { mainRoute } from "@/constants/links";

// cache meta data
const getProgramMetaData = async (prid: number) => {
  "use cache";
  cacheLife("minutes");
  // get consultant
  const consultant = await getProgramInfo(prid);
  // return
  return consultant;
};

// meta data seo

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prid: string }>;
}): Promise<Metadata> {
  const { prid } = await params;
  const program = await getProgramMetaData(Number(prid));
  const pageTitle = `برنامج ${program?.title ?? ""} - شاورني`;
  const description =
    program?.description ??
    "برنامج استشاري مميز مقدم من خلال منصة شاورني لمساعدتك في تطوير ذاتك وتحقيق أهدافك.";
  const image =
    program?.image && program.image.trim().length > 0
      ? program.image
      : `${mainRoute}other/programs.png`;

  return {
    title: pageTitle,
    description,
    keywords: [
      program?.title ?? "",
      "شاورني",
      "برنامج استشاري",
      "استشارات",
      "shwerni",
      "جلسات استشارية",
      "نمو شخصي",
      "تحقيق الأهداف",
    ],
    openGraph: {
      title: pageTitle,
      type: "website",
      url: `${mainRoute}/program/${prid}`,
      siteName: "شاورني | Shwerni",
      description,
      images: [
        {
          url: image,
          alt: `صورة ${program?.title ?? "البرنامج"}`,
          type: "image/png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      creator: "@shwernisa",
      images: [
        {
          url: image,
          alt: `shwerni ${program?.title ?? "البرنامج"}`,
          width: 1200,
          height: 630,
          type: "image/png",
        },
      ],
    },
    icons: `${mainRoute}favicon.ico`,
  };
}

// props
type Props = {
  params: Promise<{ prid: string }>;
};

// return
const Page = async ({ params }: Props) => {
  // prid
  const { prid } = await params;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 space-y-6">
      <Suspense fallback={<SkeletonConsultant />}>
        <ProgramReserve prid={Number(prid)} />
      </Suspense>
    </div>
  );
};

export default Page;
