// componenets

// prisma data
import { getConsultantInfo } from "@/data/consultant";

// lib
import { userServer } from "@/lib/auth/server";
import ReservationForm from "./form";

// props
interface Props {
  cid: number;
  event?: boolean;
}

const FreeSessionReserve = async ({ cid, event = false }: Props) => {
  // user
  const user = await userServer();

  // get consultant info
  const info = await getConsultantInfo(cid);

  // validate
  if (!info) return;

  return (
    <div className="max-w-6xl mx-auto py-5">
      <ReservationForm
        cid={cid}
        user={user}
        consultant={info?.name}
        event={event}
      />
    </div>
  );
};

export default FreeSessionReserve;
