// React  & Next
import React from "react";

// components
import InstantDashboard from "@/components/consultant/instant";
import Error404 from "@/components/shared/error-404";
import { OwnerIsDisabled } from "@/components/legacy/layout/zStatus";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";

// lib
import { userServer } from "@/lib/auth/server";
import { ConsultantState } from "@/lib/generated/prisma/enums";

const Page: React.FC = async () => {

  const user = await userServer();

  if (!user || !user.id) return <Error404 />;

  const owner = await getOwnerbyAuthor(user.id);

  if (!owner) return <Error404 />;


  if (owner.statusA !== ConsultantState.PUBLISHED)
    return <OwnerIsDisabled owner={owner} />;


  return <InstantDashboard userId={user?.id} />;
};

export default Page;