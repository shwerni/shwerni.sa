"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import CollaborationOrders from "@/app/_components/management/employees/collaborator/orders";

// lib
import { userServer } from "@/lib/auth/server";

// primsa data
import { getCollaboratorByAuthor } from "@/data/admin/collaboration";

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
