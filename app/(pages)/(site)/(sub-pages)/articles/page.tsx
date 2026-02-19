// React & Next
import Image from "next/image";
import { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import Articles from "@/components/clients/articles/list";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Filter, { FilterContent } from "@/components/clients/articles/filter";

// prisma data
import { getSpecialties } from "@/data/specialty";
import { getArticles } from "@/data/article";
import Navigation from "@/components/clients/articles/navigation";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني | مدونة المستشارون",
  description: "shwerni Blogs - شاورني مدونة المستشارون",
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
  const {
    search = "",
    page = "1",
    orderby = "newest",
    specialties = "",
  } = await searchParams;

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
        <h3 className="text-[#094577] text-3xl text-center font-semibold">
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
          <FilterContent specialties={specialtiesList} />
        </Filter>

        {/* article content */}
        <Suspense
          key={`${search}-${page}`}
          fallback={
            <CardSkeleton
              count={9}
              CardClassName="w-72 sm:w-60 h-84"
              className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center gap-x-3 gap-y-5"
            />
          }
        >
          <ArticlesList
            search={search}
            page={page}
            specialties={specialties}
            orderby={orderby}
          />
        </Suspense>
      </div>
    </div>
  );
}

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

  return (
    <>
      <Articles articles={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
