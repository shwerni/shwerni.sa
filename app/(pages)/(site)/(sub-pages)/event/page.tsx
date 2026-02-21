// React & Next
import React, { Suspense } from "react";

// components
import Filter, {
  FilterContent,
} from "@/components/clients/freesessions/filter";
import FreeSessions from "@/components/clients/freesessions/list";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import Navigation from "@/components/clients/freesessions/navigation";
import FreeSessionsHeader from "@/components/clients/freesessions/header";

// prisma data
import { getDiscountConsultants } from "@/data/discounts";
import { timeZone } from "@/lib/site/time";
import Error404 from "@/components/shared/error-404";
import { isSameDay, parseISO } from "date-fns";
import { add25Minutes } from "@/utils/date";

// type
// filter data
type FilterParams = {
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
  // params
  const { search = "", page = "1", categories, gender } = await searchParams;

  // if today end
  const { iso } = timeZone();

  // time
  const { date } = add25Minutes(iso);

  // check day
  if (isSameDay(parseISO(date), parseISO("2026-02-23"))) return <Error404 />;

  return (
    <div>
      {/* articles headers */}
      <FreeSessionsHeader />

      <div className="md:grid grid-cols-5 space-y-5 pb-5">
        {/* side filters */}
        <Filter>
          <FilterContent />
        </Filter>

        {/* content */}
        <div className="col-span-4">
          {/* consultant list */}
          <Suspense
            key={`${search}-${page}-${gender}`}
            fallback={
              <CardSkeleton
                count={9}
                CardClassName="h-64 w-44"
                className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center gap-x-3 gap-y-5"
              />
            }
          >
            <FreeSessionsList
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

const FreeSessionsList = async ({
  search,
  page,
  categories,
  gender,
  // specialties,
}: FilterParams): Promise<React.JSX.Element> => {
  // safe page
  const n = Number(page);
  const safe = n > 0 && Number.isInteger(n) ? n : 1;

  // get consultant temp
  const data = await getDiscountConsultants(
    safe,
    search,
    categories?.split(","),
    gender?.split(","),
  );

  return (
    <>
      <FreeSessions consultants={data.items} />
      <Navigation pages={data.pages} current={data.page} total={data.total} />
    </>
  );
};
