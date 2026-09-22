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
import prisma from "@/lib/database/db";
import { EVENT_DATE, EVENT_MAX_RESERVATIONS_PER_CONSULTANT } from "@/components/clients/event/constant";


type Props = {
  params: Promise<{ cid: string }>;
};

const Page = async ({ params }: Props) => {
  const { cid } = await params;
  const cidN = Number(cid);

  const consultant = await getConsultantStates(cidN);

  if (
    !consultant ||
    consultant.approved !== ApprovalState.APPROVED ||
    consultant.statusA !== ConsultantState.PUBLISHED
  )
    return <Error404 />;

  const reservedCount = await prisma.freeSession.count({
    where: { consultantId: cidN, date: EVENT_DATE },
  });

  // consultant hit the cap — treat identically to "not available",
  // same 404 the list-hiding uses so there's no separate leak of state
  if (reservedCount >= EVENT_MAX_RESERVATIONS_PER_CONSULTANT)
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
