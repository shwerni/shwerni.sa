"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import AllInstants from "@/app/_components/management/layout/instant";

// prisma data
import { getAllInstantAdmin } from "@/data/admin/instant";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { timeZone } from "@/lib/site/time";

export default async function Page() {
  // get insatnts
  const insatnts = await getAllInstantAdmin();

  // timezone
  const timezone = await timeZone();

  // if not exist
  if (!timezone || !timezone.date || !timezone.time) return <WrongPage />;

  // return
  return <AllInstants instants={insatnts} role={UserRole.ADMIN} />;
}
