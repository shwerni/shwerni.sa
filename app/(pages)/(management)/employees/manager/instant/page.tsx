"use server";
// React & Next
import React from "react";

// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import AllInstants from "@/app/_components/management/layout/instant";
import ManagerInstantForm from "@/app/_components/management/employees/manager/instant";

// prisma data
import { getInstantOwnerByAuthor } from "@/data/instant";
import { getAllInstantAdmin } from "@/data/admin/instant";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { userServer } from "@/lib/auth/server";
import { timeZone } from "@/lib/site/time";
import { getSupabaseConfig } from "@/lib/database/supabase/config";

export default async function Page() {
  // get insatnts
  const insatnts = await getAllInstantAdmin();

  // user
  const user = await userServer();

  // if not exist
  if (!user?.id) return <WrongPage />;

  // get instant state
  const instant = await getInstantOwnerByAuthor(user.id);

  // timezone
  const timezone = await timeZone();

  // if not exist
  if (!timezone || !timezone.date || !timezone.time) return <WrongPage />;

  // supabase
  const supabaseConfig = getSupabaseConfig();

  // return
  return (
    <div>
      <ManagerInstantForm
        instant={instant}
        author={user.id}
        supabaseConfig={supabaseConfig}
      />
      <AllInstants instants={insatnts} role={UserRole.MANAGER} lang="ar" />
    </div>
  );
}
