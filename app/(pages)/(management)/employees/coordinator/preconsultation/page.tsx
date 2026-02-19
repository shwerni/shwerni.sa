"use server";
// components
import { EmployeePreConsultion } from "@/app/_components/management/layout/preconsultation";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma data
import { getAllPreConsultationSeassionAdmin } from "@/data/admin/preconsultion";

export default async function Page() {
  // get orders
  const sessions = await getAllPreConsultationSeassionAdmin();
  // return
  return (
    <EmployeePreConsultion
      sessions={sessions}
      role={UserRole.COORDINATOR}
      lang="ar"
    />
  );
}
