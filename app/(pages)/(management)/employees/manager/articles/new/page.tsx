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

// primsa types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { findUser } from "@/utils";

// icons
import { ChevronLeftIcon } from "lucide-react";

export default async function Page() {
  // user
  const user = await userServer();

  // if not exist
  if (!user || !user.id) return <WrongPage />;

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
          <h3 className="text-lg capitalize">create new article</h3>
          <EditArticleForm variant="new" role={user.role} user={user.id} />
        </div>
      </div>
    </ZSection>
  );
}
