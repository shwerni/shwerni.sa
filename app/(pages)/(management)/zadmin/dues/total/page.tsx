"use server";
// React & Next
import Link from "next/link";

// components
import TotalDuesAdmin from "@/app/_components/management/admin/dues/total";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// prisma data
import { getTotalDuesAdminByMonth } from "@/data/admin/dues";

// api utils
import { timeZone } from "@/lib/site/time";

// icons
import { ChevronLeftIcon } from "lucide-react";

export default async function Page() {
  // date
  const response = timeZone();

  // if not exist
  if (!response || !response.date) return <WrongPage />;

  // date
  const date = response.date;

  // get meetings
  const dues = await getTotalDuesAdminByMonth(
    `${date.slice(5, 7)}-${date.slice(0, 4)}`
  );
  
  // if not exist
  if (!dues) return <WrongPage />;

  // return
  return (
    <div>
      <Link
        href="/zadmin/dues"
        className="flex flex-row gap-1 items-center w-fit mx-5 my-5"
      >
        <ChevronLeftIcon />
        <h5 className="pt-1">all dues</h5>
      </Link>
      <div className="mx-2">
        <TotalDuesAdmin dues={dues} date={date} />;
      </div>
    </div>
  );
}
