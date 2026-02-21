// React & Next
import { Suspense } from "react";

// components
import Error404 from "@/components/shared/error-404";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import SkeletonConsultant from "@/components/clients/consultants/consultant/skeleton";
import FreeSessionReserve from "@/components/clients/freesessions/reservation/reserve";
import FressSessionConsultant from "@/components/clients/freesessions/consultant/consultant";

// prisma data
import { getConsultantStates } from "@/data/consultant";

// prisma types
import { ApprovalState, ConsultantState } from "@/lib/generated/prisma/client";
import { isSameDay, parseISO } from "date-fns";
import { add25Minutes } from "@/utils/date";
import { timeZone } from "@/lib/site/time";

// props
type Props = {
  params: Promise<{ cid: string }>;
};

// return
const Page = async ({ params }: Props) => {
  // cid
  const { cid } = await params;

  // parse cid as number
  const cidN = Number(cid);

  // consultant
  const consultant = await getConsultantStates(cidN);

  // time
  const { iso } = timeZone();
  
  // time
  const { date } = add25Minutes(iso);

  // check day
  if (isSameDay(parseISO(date), parseISO("2026-02-23"))) return <Error404 />;

  // if consultant refused, show 404 only
  if (
    !consultant ||
    consultant.approved !== ApprovalState.APPROVED ||
    consultant.statusA !== ConsultantState.PUBLISHED
  )
    return <Error404 />;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SkeletonConsultant />}>
        <FressSessionConsultant cid={cidN} />
      </Suspense>
      <Suspense fallback={<CardSkeleton count={1} className="w-full" />}>
        {consultant.status && <FreeSessionReserve cid={cidN} />}
      </Suspense>
    </div>
  );
};

export default Page;
