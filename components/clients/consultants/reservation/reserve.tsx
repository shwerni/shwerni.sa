// componenets
import Reservation from "@/components/clients/consultants/reservation/form";

// prisma data
import {
  getConsultantCost,
  getConsultantInfo,
  getUnavailableWeekdays,
} from "@/data/consultant";
import { getFinanceConfig } from "@/data/admin/settings/finance";
import { userServer } from "@/lib/auth/server";

// props
interface Props {
  cid: number;
}

const ConsultantReserve = async ({ cid }: Props) => {
  // user
  const user = await userServer();

  // get consultant info
  const info = await getConsultantInfo(cid);

  // get unavailable week days to exclude form calendar
  const unavailable = await getUnavailableWeekdays(cid);

  // get consultant cost
  const cost = await getConsultantCost(cid);

  // get finance
  const finance = await getFinanceConfig();

  // get user wallet
  // const wallet = await getWalletByAuthor(user?.id ?? "");

  // validate
  if (!cost || !finance || !info) return;

  return (
    <div className="max-w-6xl mx-auto py-5">
      <Reservation
        cid={cid}
        cost={cost}
        user={user}
        consultant={info?.name}
        finance={finance}
        unavailable={[...unavailable]}
      />
    </div>
  );
};

export default ConsultantReserve;
