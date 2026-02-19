// React & Next
import React from "react";
import { Metadata } from "next";

// components
import DuesOwner from "@/app/_components/consultants/owner/dues";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// prisma data
import { getAllDuesOwner } from "@/data/dues";
import { getOwnerForDues } from "@/data/consultant";
import { getTaxCommission } from "@/data/admin/settings/finance";

// lib
import { timeZone } from "@/lib/site/time";
import { userServer } from "@/lib/auth/server";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - المستحقات",
  description: "shwerni dues - شاورني المستحقات",
};

export default async function Page() {
  // user
  const user = await userServer();

  // if not exist
  if (!user || !user.id) return <WrongPage />;

  // cid
  const owner = await getOwnerForDues(user.id);

  // if not exist
  if (!owner || !owner.cid) return <WrongPage />;

  // get meetings
  const dues = await getAllDuesOwner(owner.cid);

  // settings
  const settings = await getTaxCommission();

  // date
  const { date } = timeZone();
  
  // if not exist
  if (!dues) return <WrongPage />;

  // return
  return (
    <DuesOwner
      dues={dues}
      date={date}
      owner={owner}
      defaultCommission={settings?.commission ?? null}
    />
  );
}
