"use server";
// React & Next
import React from "react";

// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import OwnerDues from "@/app/_components/management/layout/dues/owner";

// prisma data
import { getOwnersInfoCid } from "@/data/consultant";
import { getAllDuesAdminByCid } from "@/data/admin/dues";

// lib
import { timeZone } from "@/lib/site/time";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// Page
export default async function Page({
  params,
}: {
  params: Promise<{ cid: string }>;
}) {
  // cid
  const { cid } = await params;

  // cid as number
  const nCid = Number(cid);

  // get meetings
  const dues = await getAllDuesAdminByCid(nCid);

  // get owner
  const ownerMeta = await getOwnersInfoCid(nCid);

  // owner name
  const owner = ownerMeta?.name;

  // date
  const { date } = await timeZone();

  // if not exist
  if (!dues || !owner) return <WrongPage />;

  // return
  return (
    <OwnerDues
      role={UserRole.MANAGER}
      lang="ar"
      dues={dues}
      date={date}
      cid={Number(cid)}
      owner={owner}
    />
  );
}
