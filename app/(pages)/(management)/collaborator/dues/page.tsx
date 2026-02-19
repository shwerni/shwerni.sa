"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// api utils
import { timeZone } from "@/lib/site/time";

// icons
import TotalDuesCollaborator from "@/app/_components/management/employees/collaborator/dues";
import {
  getCollaboratorByAuthor,
  getTotalDuesCollaboratorByMonth,
} from "@/data/admin/collaboration";
import { userServer } from "@/lib/auth/server";

export default async function Page() {
  // user
  const user = await userServer();

  // validate
  if (!user?.id) return <WrongPage />;

  // collaborator
  const collaborator = await getCollaboratorByAuthor(user.id);

  // validate
  if (!collaborator) return <WrongPage />;

  // date
  const { date } = timeZone();

  // get meetings
  const dues = await getTotalDuesCollaboratorByMonth(
    collaborator.id,
    `${date.slice(5, 7)}-${date.slice(0, 4)}`,
  );

  // if not exist
  if (!dues) return <WrongPage />;

  // return
  return (
    <TotalDuesCollaborator
      dues={dues}
      date={date}
      collaboratorId={collaborator.id}
    />
  );
}
