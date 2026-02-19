"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import CollaborationProfile from "@/app/_components/management/employees/collaborator/profile";

// primsa data
import { getCollaboratorByAuthor } from "@/data/admin/collaboration";

// prisma types
import { userServer } from "@/lib/auth/server";

export default async function Page() {
  // user
  const user = await userServer();

  // validate
  if (!user?.id) return <WrongPage />;

  // collaborator
  const collaborator = await getCollaboratorByAuthor(user.id);

  // return
  return (
    <CollaborationProfile iCollaboration={collaborator} userId={user.id} />
  );
}
