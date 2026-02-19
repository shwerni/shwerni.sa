// components
import Error404 from "@/components/shared/error-404";
import ConsultantProfile from "@/components/clients/consultants/consultant/profile";

// prisma data
import { getConsultant } from "@/data/consultant";
import { getCollaboratorById } from "@/data/admin/collaboration";

// hooks
import { userServer } from "@/lib/auth/server";
import { getFavorite } from "@/data/favorites";

const Consultant = async ({
  cid,
  collaboration,
}: {
  cid: number;
  collaboration?: string;
}) => {
  // user
  const user = await userServer();

  // load owner
  const consultant = await getConsultant(Number(cid));

  // get favorite
  const favorite = user?.id ? await getFavorite(user?.id, cid) : false;
  
  // collaborator
  const collaborator = collaboration
    ? await getCollaboratorById(collaboration)
    : null;

  // if not exist
  if (!consultant) return <Error404 />;

  return (
    <ConsultantProfile
      user={user}
      favorite={favorite}
      consultant={consultant}
      collaboration={collaborator}
    />
  );
};

export default Consultant;
