"use server";
// React & Next
import React from "react";

// components

// primsa data
import {
  getCollaboratorByAuthor,
} from "@/data/admin/collaboration";

// prisma types
import { userServer } from "@/lib/auth/server";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import CollaborationOrders from "@/app/_components/management/employees/collaborator/orders";

export default async function Page() {
  // user
  const user = await userServer();

  // validate
  if (!user?.id) return <WrongPage />;

  // collaborator
  const collaborator = await getCollaboratorByAuthor(user.id);

  // validate
  if (!collaborator) return <WrongPage />;

  // return
  return <CollaborationOrders collaboratorId={collaborator.id} lang="ar" />;
}
