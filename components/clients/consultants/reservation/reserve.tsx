// componenets
import Reservation from "@/components/clients/consultants/reservation/form";
import DiscountBadge from "@/components/clients/event/discounts/discount-badge";
// prisma data
import {
  getConsultantCost,
  getConsultantInfo,
  getUnavailableWeekdays,
} from "@/data/consultant";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// lib
import { userServer } from "@/lib/auth/server";
import AddYourReview from "../consultant/post-review";

// props
interface Props {
  cid: number;
  collaboration?: string;
}

const ConsultantReserve = async ({ cid, collaboration }: Props) => {
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

  // discount // dynamic later
  const isDiscount = info?.DiscountConsultant.some(
    (i) => i.discountId === 3 && i.status,
   );

  // cost
  if (isDiscount) cost[30] = 77.3;

  return (
    <div className="max-w-6xl mx-auto py-5 space-y-8">
      {/* discount badge */}
      {isDiscount && (
        <div className="w-fit mx-auto">
          <DiscountBadge />
        </div>
      )}
      {/* reservation */}
      <Reservation
        cid={cid}
        cost={cost}
        user={user}
        consultant={info?.name}
        finance={finance}
        unavailable={[...unavailable]}
        collaboration={collaboration}
      />
      {/* review */}
      <AddYourReview
        cid={cid}
        consultant={info.name}
        author={user?.id || null}
        name={user?.name || null}
      />
    </div>
  );
};

export default ConsultantReserve;
