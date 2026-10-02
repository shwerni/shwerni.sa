// React & Next
import { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

// components
import Program from "@/components/clients/programs/program/program";
import ProgramSkeleton from "@/components/clients/programs/skeleton";

// prisma data
import { getProgramInfo } from "@/data/programs";

// prisma types
import { ProgramState } from "@/lib/generated/prisma/enums";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";

// cache meta data
const getProgramMetaData = async (prid: number) => {
  "use cache";
  cacheLife("weeks");
  // get consultant
  const consultant = await getProgramInfo(prid);
  // return
  return consultant;
};

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني".
// a program the page hides (missing or not published: 404) gets no metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ prid: string }>;
}): Promise<Metadata> {
  const { prid } = await params;
  const pridN = Number(prid);
  const program = await getProgramMetaData(pridN);

  if (!program || program.status !== ProgramState.PUBLISHED) return {};

  const title = `برنامج ${program.title}`;
  const description =
    program.description ||
    "برنامج استشاري مميز مقدم من خلال منصة شاورني لمساعدتك في تطوير ذاتك وتحقيق أهدافك.";
  const image =
    program.image && program.image.trim().length > 0
      ? program.image
      : `${mainRoute}other/programs.png`;
  // the clean url, never with query params
  const url = `${mainRoute}programs/${pridN}`;
  const ogImage = { url: image, alt: `صورة ${program.title}` };

  return {
    title,
    description,
    keywords: [
      program.title,
      "شاورني",
      "برنامج استشاري",
      "استشارات",
      "shwerni",
      "جلسات استشارية",
      "نمو شخصي",
      "تحقيق الأهداف",
    ],
    alternates: { canonical: url },
    openGraph: {
      ...defaultMetaApi.openGraph,
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

// props
type Props = {
  params: Promise<{ prid: string }>;
};

// return
const Page = async ({ params }: Props) => {
  // cid
  const { prid } = await params;

  // parse prid as number
  const pridN = Number(prid);

  // a missing or unpublished program answers 404 (the site not-found page), checked here
  // before anything streams; the Program component keeps its own check as a fallback
  const program = await getProgramMetaData(pridN);
  if (!program || program.status !== ProgramState.PUBLISHED) notFound();

  return (
    <div className="space-y-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 space-y-6">
        <Suspense fallback={<ProgramSkeleton />}>
          <Program prid={pridN} />
        </Suspense>
      </div>
      {/* <Suspense fallback={<CardSkeleton count={1} className="w-full" />}>
        <ConsultantReserve program={program} />
      </Suspense> */}
    </div>
  );
};

export default Page;
