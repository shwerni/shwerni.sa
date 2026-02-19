// React & Next
import React from "react";

// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import EmployeeEditPreConsultation from "@/app/_components/management/layout/preconsultation/editSession";

// primsa data
import { getPreConsultationSeassionByPid } from "@/data/admin/preconsultion";

// hooks
import { userServer } from "@/lib/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ pid: string }>;
}) {
  // pid
  const { pid } = await params;
  
  // user
  const user = await userServer();

  // if not exist
  if (!user) return <WrongPage />;
  // get session
  const session = await getPreConsultationSeassionByPid(Number(pid));
  // if not exist
  if (!session) return <WrongPage />;
  // return
  return <EmployeeEditPreConsultation session={session} user={user} />;
}
