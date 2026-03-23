// components
import Error404 from "@/components/shared/error-404";
import ConsultantProfile from "@/components/clients/consultants/consultant/profile";

// prisma data
import { getFavorite } from "@/data/favorites";
import { getConsultant } from "@/data/consultant";

// hooks
import { userServer } from "@/lib/auth/server";

const Consultant = async ({ cid }: { cid: number; }) => {
  // user
  const user = await userServer();

  // load owner
  const consultant = await getConsultant(Number(cid));

  // get favorite
  const favorite = user?.id ? await getFavorite(user?.id, cid) : false;

  // if not exist
  if (!consultant) return <Error404 />;

  return (
    <ConsultantProfile
      user={user}
      favorite={favorite}
      consultant={consultant}
    />
  );
};

export default Consultant;
