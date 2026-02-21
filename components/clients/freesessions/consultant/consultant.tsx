// components
import FreeSessionProfile from "./profile";
import Error404 from "@/components/shared/error-404";

// prisma data
import { getConsultant } from "@/data/consultant";

const FressSessionConsultant = async ({ cid }: { cid: number }) => {
  // load owner
  const consultant = await getConsultant(Number(cid));

  // if not exist
  if (!consultant) return <Error404 />;

  return <FreeSessionProfile consultant={consultant} />;
};

export default FressSessionConsultant;
