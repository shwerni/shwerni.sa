"use server";
// React & Next
import React from "react";
import Link from "next/link";

// components
import { ZSection } from "@/app/_components/layout/section";
import EditUser from "@/app/_components/management/admin/user/editUser";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// prisma data
import { getUserById } from "@/data/user";

// icons
import { ChevronLeftIcon } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // id
  const { id } = await params;

  // get owners
  const user = await getUserById(id);
  // if not exist
  if (!user) return <WrongPage />;
  // return
  return (
    <ZSection>
      <div className="max-w-4xl sm:w-10/12 mx-auto space-y-10">
        <Link
          href="/zadmin/users"
          className="flex flex-row gap-1 items-center w-fit"
        >
          <ChevronLeftIcon />
          <h5 className="pt-1">users</h5>
        </Link>
        <div className="w-10/12 mx-auto space-y-10">
          <h3 className="text-lg capitalize">edit user #{user?.name}</h3>
          <EditUser user={user} />
        </div>
      </div>
    </ZSection>
  );
}
