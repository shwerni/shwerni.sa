// React  & Next
import React from "react";

// components
import InstantDashboard from "@/components/consultant/instant";
import Error404 from "@/components/shared/error-404";
import { OwnerIsDisabled } from "@/app/_components/layout/zStatus";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";

// lib
import { userServer } from "@/lib/auth/server";
import { ConsultantState } from "@/lib/generated/prisma/enums";

const Page: React.FC = async () => {
  // user
  const user = await userServer();

  // if user not exist
  if (!user || !user.id) return <Error404 />;

  // get instant profile
  const owner = await getOwnerbyAuthor(user.id);

  // if user not exist
  if (!owner) return <Error404 />;

  return owner.statusA === ConsultantState.PUBLISHED ? (
    <InstantDashboard userId={user?.id} />
  ) : (
    <OwnerIsDisabled owner={owner} />
  );
};

export default Page;
