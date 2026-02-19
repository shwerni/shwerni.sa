"use server";
// React & Next
import React from "react";

// components
import { ApplicantConsultants } from "@/app/_components/management/layout/consultants/applicants";

// prisma data
import { getNotApprovedConsultantsAdmin } from "@/data/admin/owner";

// peisma types
import { UserRole } from  "@/lib/generated/prisma/enums";

export default async function Page() {
  // get orders
  const owners = await getNotApprovedConsultantsAdmin();

  // return
  return <ApplicantConsultants owners={owners} role={UserRole.ADMIN} />;
}
