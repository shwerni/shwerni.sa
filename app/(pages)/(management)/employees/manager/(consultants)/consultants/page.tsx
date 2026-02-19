"use server";
// components
import { ApprovedConsultants } from "@/app/_components/management/layout/consultants";

// prisma data
import { getApprovedConsultantsAdmin } from "@/data/admin/owner";

// peisma types
import { UserRole } from "@/lib/generated/prisma/enums";

export default async function Page() {
  // get orders
  const owners = await getApprovedConsultantsAdmin();

  // return
  return (
    <ApprovedConsultants owners={owners} role={UserRole.MANAGER} lang="ar" />
  );
}
