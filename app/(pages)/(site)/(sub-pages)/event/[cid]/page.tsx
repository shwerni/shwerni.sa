// React & Next
import { Suspense } from "react";

// components
import Error404 from "@/components/shared/error-404";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import SkeletonConsultant from "@/components/clients/consultants/consultant/skeleton";
import FressSessionConsultant from "@/components/clients/freesessions/consultant/consultant";

// prisma data
import { getConsultantStates } from "@/data/consultant";

// prisma types
import { ApprovalState, ConsultantState } from "@/lib/generated/prisma/client";

// constants
import { EVENT_MAX_RESERVATIONS_PER_CONSULTANT } from "@/components/clients/event/constant";
import { getEventReservedCount, isEventConsultant } from "@/data/temp-event";
import FreeSessionReserve from "@/components/clients/event/reserve";

// props
type Props = {
  params: Promise<{ cid: string }>;
};

const Page = async ({ params }: Props) => {
  const { cid } = await params;
  const cidN = Number(cid);

  // reject non-numeric / invalid ids before touching the database
  if (!Number.isInteger(cidN) || cidN <= 0) return <Error404 />;

  // independent checks — run in parallel
  const [consultant, enrolled, reservedCount] = await Promise.all([
    getConsultantStates(cidN),
    isEventConsultant(cidN),
    getEventReservedCount(cidN),
  ]);

  // not published / not approved
  if (
    !consultant ||
    consultant.approved !== ApprovalState.APPROVED ||
    consultant.statusA !== ConsultantState.PUBLISHED
  )
    return <Error404 />;

  // not enrolled in the national day discount
  if (!enrolled) return <Error404 />;

  // reached the daily cap — same 404 as the hidden list entry
  if (reservedCount >= EVENT_MAX_RESERVATIONS_PER_CONSULTANT)
    return <Error404 />;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SkeletonConsultant />}>
        <FressSessionConsultant cid={cidN} />
      </Suspense>
      <Suspense fallback={<CardSkeleton count={1} className="w-full" />}>
        {consultant.status && <FreeSessionReserve cid={cidN} event />}
      </Suspense>
    </div>
  );
};

export default Page;
