"use server";
// React & Next
import Link from "next/link";

// components
import { ZSection } from "@/app/_components/layout/section";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import OwnerTimingsAdmin from "@/app/_components/management/admin/timings";

// prisma data
import { getOwnerByCid } from "@/data/consultant";

// icons
import { ChevronLeftIcon } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ cid: string }>;
}) {
  // cid
  const { cid } = await params;

  // get owners
  const owner = await getOwnerByCid(Number(cid));

  // if not exist
  if (!owner) return <WrongPage />;

  // return
  return (
    <ZSection>
      <div className="max-w-4xl sm:w-10/12 mx-auto space-y-10">
        <Link
          href={"/zadmin/owners/" + cid}
          className="flex flex-row gap-1 items-center"
        >
          <ChevronLeftIcon />
          <h5 className="pt-1">
            #{cid} {"owner's"} page
          </h5>
        </Link>
        <div className="w-10/12 mx-auto space-y-10">
          <h3 className="text-lg capitalize">
            edit owner #{owner?.cid} timings
          </h3>
          <OwnerTimingsAdmin cid={owner.cid} author={owner.userId} />
        </div>
      </div>
    </ZSection>
  );
}
