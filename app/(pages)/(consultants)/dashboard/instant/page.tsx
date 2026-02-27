// React  & Next
import React from "react";

// components
import InstantOwners from "@/app/_components/consultants/owner/instant";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import { OwnerIsDisabled } from "@/app/_components/layout/zStatus";

// pacakges
import moment from "moment";

// lib
import { getSupabaseConfig } from "@/lib/database/supabase/config";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";
import { getInstantOwnerByAuthor } from "@/data/instant";
import { getMeetingsByCidAndRange } from "@/data/meetings";

// prisma types

// lib

// hooks
import { userServer } from "@/lib/auth/server";
import { timeZone } from "@/lib/site/time";
import { ConsultantState } from "@/lib/generated/prisma/enums";
import InstantDashboard from "@/components/consultant/instant";

const Page: React.FC = async () => {
  // user
  const user = await userServer();

  // if user not exist
  if (!user || !user.id) return <WrongPage />;

  // get instant profile
  const owner = await getOwnerbyAuthor(user.id);

  // if user not exist
  if (!owner) return <WrongPage />;

  return owner.statusA === ConsultantState.PUBLISHED ? (
    <InstantDashboard userId={user?.id} />
  ) : (
    <OwnerIsDisabled owner={owner} />
  );
};

export default Page;
