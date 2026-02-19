"use server";
// React & Next
import React from "react";
import Link from "next/link";

// components
import { ZSection } from "@/app/_components/layout/section";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import { EditArticleForm } from "@/app/_components/management/layout/articles/form";

// lib
import { userServer } from "@/lib/auth/server";

// prisma data
import { getArticlesByAidAdmin } from "@/data/admin/article";

// primsa types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { findUser } from "@/utils";

// icons
import { ChevronLeftIcon } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ aid: string }>;
}) {
  // bid
  const { aid } = await params;

  // user
  const user = await userServer();

  // get artilces
  const artilce = await getArticlesByAidAdmin(Number(aid));

  // if not exist
  if (!artilce || !user || !user.id) return <WrongPage />;

  // return
  return (
    <ZSection>
      <div className="max-w-4xl sm:w-10/12 mx-auto space-y-10">
        <Link
          href={`${findUser(UserRole.ADMIN)?.url}articles`}
          className="flex flex-row gap-1 items-center w-fit"
        >
          <ChevronLeftIcon />
          <h5 className="pt-1">article</h5>
        </Link>
        <div className="w-10/12 mx-auto space-y-10">
          <h3 className="text-lg capitalize">edit article #{aid}</h3>
          <EditArticleForm
            article={artilce}
            variant="edit"
            role={user.role}
            user={user.id}
          />
        </div>
      </div>
    </ZSection>
  );
}
