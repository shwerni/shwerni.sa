// React & Next
import { Metadata } from "next";
import React, { Suspense } from "react";

// components
import Filter, {
  FilterContent,
} from "@/components/clients//sub-pages/event/discounts/filter";
import EventHeader from "@/components/clients/sub-pages/event/header";
import Consultants from "@/components/clients/sub-pages/event/discounts/list";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Navigation from "@/components/clients/sub-pages/event/discounts/navigation";

// prisma data
import { getDiscountConsultants } from "@/data/discounts";

// constants
import { mainRoute } from "@/constants/links";
import { getCampaignFor } from "@/data/event";
import { NoActiveEvents } from "@/components/clients/sub-pages/event/no-event";

// meta data seo
export async function generateMetadata(): Promise<Metadata> {
  const campaign = await getCampaignFor("EVENT_PAGE");

  const fallbackTitle = "شاورني - العروض والخصومات | ترقب أحدث العروض الحصرية";
  const fallbackDesc =
    "صفحة العروض الحصرية من منصة شاورني. ترقب أحدث العروض والخصومات على جلسات الاستشارة النفسية والأسرية والمهنية بأسعار مميزة.";

  const title = campaign?.title
    ? `شاورني - ${campaign.title}`
    : campaign?.emptyTitle
      ? `شاورني - ${campaign.emptyTitle}`
      : fallbackTitle;

  const description =
    campaign?.description ??
    campaign?.subtitle ??
    campaign?.emptyBody ??
    fallbackDesc;

  const image = campaign?.image ?? `${mainRoute}other/owners.jpeg`;
  const url = `${mainRoute}event`;

  const og = {
    url: image,
    alt: campaign?.title ?? "shwerni",
    type: "image/jpg",
    width: 1200,
    height: 630,
  };

  return {
    title,
    description,
    keywords: [
      ...(campaign?.title ? [campaign.title] : []),
      "عروض شاورني",
      "خصومات استشارة",
      "تخفيضات استشارة نفسية",
      "عروض استشارة أسرية",
      "منصة استشارات سعودية",
      "مستشار نفسي",
      "مستشار أسري",
      "استشارات بسعر مخفض",
    ],
    alternates: { canonical: url },
    robots: campaign ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "شاورني - العروض الحصرية",
      locale: "ar_SA",
      images: [og],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@shwernisa",
      images: [og],
    },
    icons: `${mainRoute}favicon.ico`,
  };
}

// type
// filter data
type FilterParams = {
  did: number;
  search?: string;
  page?: string;
  categories?: string;
  gender?: string;
};

// interface
interface Props {
  searchParams: Promise<FilterParams>;
}

export default async function Page({ searchParams }: Props) {
  const { search = "", page = "1", categories, gender } = await searchParams;

  const campaign = await getCampaignFor("EVENT_PAGE");

  // nothing active → styled empty state from the campaign, or defaults
  if (!campaign) return <NoActiveEvents />;
  if (!campaign.discountId) return <NoActiveEvents campaign={campaign} />;

  return (
    <div>
      <EventHeader campaign={campaign} />

      <div className="md:grid grid-cols-5 space-y-5 pb-5">
        <Filter>
          <FilterContent />
        </Filter>

        <div className="col-span-4">
          <Suspense
            key={`${search}-${page}-${gender}-${categories}`}
            fallback={
              <CardSkeleton
                count={9}
                CardClassName="h-64 w-44"
                className="..."
              />
            }
          >
            <ConsultantsList
              did={campaign.discountId}
              search={search}
              page={page}
              categories={categories}
              gender={gender}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

const ConsultantsList = async ({
  did,
  search,
  page,
  categories,
  gender,
  // specialties,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get articles
  const data = await getDiscountConsultants(
    did,
    safe,
    search,
    categories?.split(","),
    gender?.split(","),
  );

  return (
    <>
      <Consultants consultants={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
