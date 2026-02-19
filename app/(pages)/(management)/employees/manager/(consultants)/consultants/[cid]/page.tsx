"use server";
// React & Next
import React from "react";

// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import EditOwner from "@/app/_components/management/layout/consultants/editOwner";

// prisma data
import { getOwnerByCid } from "@/data/consultant";

// primsa types
import { UserRole } from "@/lib/generated/prisma/enums";

type Props = {
  params: Promise<{ cid: string }>;
  searchParams: Promise<{
    approved?: string;
  }>;
};

export default async function Page({ params, searchParams }: Props) {
  // cid
  const { cid } = await params;

  // session
  const { approved } = await searchParams;

  // approve for page redirect
  const isApproval = approved !== undefined;

  // redirect link
  const url = isApproval ? "consultants" : "applicants";

  // get owners
  const owner = await getOwnerByCid(Number(cid));

  // if not exist
  if (!owner) return <WrongPage />;
  // return
  return (
    <EditOwner owner={owner} role={UserRole.MANAGER} url={url} lang="ar" />
  );
}
