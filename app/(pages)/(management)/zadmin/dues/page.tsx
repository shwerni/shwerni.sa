"use server";
// React & Next
import React from "react";

// components
import Dues from "@/app/_components/management/admin/dues";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// prisma data
import { getAllDuesAdmin } from "@/data/admin/dues";

// lib
import { timeZone } from "@/lib/site/time";

export default async function Page() {
  // get meetings
  const dues = await getAllDuesAdmin();

  // date
  const { date } = await timeZone();

  // if not exist
  if (!dues) return <WrongPage />;

  // return
  return <Dues dues={dues} date={date} />;
}
