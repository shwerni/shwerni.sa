// componenets
import Reservation from "@/components/clients/freesessions/reservation/form";

// prisma data
import { getConsultantInfo } from "@/data/consultant";

// lib
import { userServer } from "@/lib/auth/server";

// props
interface Props {
  cid: number;
}

const FreeSessionReserve = async ({ cid }: Props) => {
  // user
  const user = await userServer();

  // get consultant info
  const info = await getConsultantInfo(cid);

  // validate
  if (!info) return;

  return (
    <div className="max-w-6xl mx-auto py-5">
      <Reservation cid={cid} user={user} consultant={info?.name} />
    </div>
  );
};

export default FreeSessionReserve;
