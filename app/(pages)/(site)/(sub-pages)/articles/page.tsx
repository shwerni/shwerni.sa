// React & Next
import Image from "next/image";
import { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import RequestTime from "@/components/shared/request-time";
import Articles from "@/components/clients/articles/list";
import Navigation from "@/components/clients/articles/navigation";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Filter, { FilterContent } from "@/components/clients/articles/filter";
import { CollectionJsonLd } from "@/components/seo/collection-json-ld";

// prisma data
import { getArticles } from "@/data/article";
import { getSpecialties } from "@/data/specialties";

// constants
import { defaultMetaApi } from "@/constants";
import { mainRoute } from "@/constants/links";

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني"
const title = "مدونة المستشارين";
const fullTitle = `${title} | شاورني`;
const description = "مدونة شاورني — مقالات المستشارين";
const url = `${mainRoute}articles`;

export const metadata: Metadata = {
  title,
  description,
  // the same canonical for every search, order and page combination
  alternates: { canonical: url },
  openGraph: { ...defaultMetaApi.openGraph, title: fullTitle, description, url },
  twitter: { ...defaultMetaApi.twitter, title: fullTitle, description },
};

// type
// filter data
type FilterParams = {
  search?: string;
  page?: string;
  orderby?: "newest" | "viral";
  specialties?: string;
};

// interface
interface Props {
  searchParams: Promise<FilterParams>;
}

const fetchSpecialties = async () => {
  // specialties list
  "use cache";
  cacheLife("weeks");
  return await getSpecialties();
};

export default async function Page({ searchParams }: Props) {
  // params
  // specialties list
  const specialtiesList = await fetchSpecialties();

  return (
    <div>
      {/* articles headers */}
      <div className="relative bg-linear-to-b from-[#34068312] to-[#7E91FF47] px-6 sm:px-8 py-20 space-y-3 mx-auto my-0! rounded overflow-hidden">
        {/* images style */}
        <Image
          src="/svg/articles-stars.svg"
          alt="icon"
          width={155}
          height={155}
          className="absolute top-10 right-2"
        />
        {/* content */}
        <h3 className="text-theme-700 text-3xl text-center font-semibold">
          مدونة شاورني – أفكار ومعرفة تلامس حياتك
        </h3>
        <p className="text-gray-800 text-base text-center max-w-xl mx-auto">
          اكتشف مقالات ثرية كتبها مستشارون متخصصون في مجالات الأسرة، النفس،
          والعمل. نشاركك تجارب وأدوات تساعدك على تطوير ذاتك واتخاذ قرارات أوضح
          في حياتك اليومية.
        </p>
      </div>

      <div className="md:grid grid-cols-5 space-y-5 pb-5">
        {/* side filters */}
        <Filter>
          {/* the filters read the url (request data): rendered at request time, the frame stays
              in the shell */}
          <Suspense fallback={null}>
            <RequestTime searchParams={searchParams}>
              <FilterContent specialties={specialtiesList} />
            </RequestTime>
          </Suspense>
        </Filter>

        {/* article content: the search params are request data, so they're read inside suspense
            and the header and filters stay in the prerendered shell */}
        <Suspense fallback={listSkeleton}>
          <ArticlesResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

// list skeleton, shown on the first load and on every search or page change
const listSkeleton = (
  <CardSkeleton
    count={9}
    CardClassName="w-72 sm:w-60 h-84"
    className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center gap-x-3 gap-y-5"
  />
);

const ArticlesResults = async ({ searchParams }: Props) => {
  // params
  const {
    search = "",
    page = "1",
    orderby = "newest",
    specialties = "",
  } = await searchParams;

  return (
    <Suspense key={`${search}-${page}`} fallback={listSkeleton}>
      <ArticlesList
        search={search}
        page={page}
        specialties={specialties}
        orderby={orderby}
      />
    </Suspense>
  );
};

const ArticlesList = async ({
  search,
  page,
  specialties,
  orderby,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get articles
  const data = await getArticles(safe, search, orderby);

  // the item list describes the default list only: first page, newest first, no search or filters
  const isDefaultList =
    !search && safe === 1 && (!orderby || orderby === "newest") && !specialties;

  return (
    <>
      <CollectionJsonLd
        path="articles"
        name={fullTitle}
        description={description}
        items={
          isDefaultList
            ? data.items.map((a) => ({ name: a.title, path: `articles/${a.aid}` }))
            : undefined
        }
      />
      <Articles articles={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
