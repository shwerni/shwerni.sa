// componenets
import AddYourReview from "../consultant/post-review";
import Reservation from "@/components/clients/consultants/reservation/form";
import DiscountBadge from "@/components/clients/sub-pages/event/discount-badge";

// prisma data
import { getConsultantInfo, getUnavailableWeekdays } from "@/data/consultant";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// lib
import { userServer } from "@/lib/auth/server";
import { getConsultantsPackages } from "@/data/packages";

// icons
import { getCampaignFor, resolveConsultantPricing } from "@/data/event";

// props
interface Props {
  cid: number;
  collaboration?: string;
}

const ConsultantReserve = async ({ cid, collaboration }: Props) => {
  // user
  const user = await userServer();

  // get consultant info
  // get unavailable week days to exclude form calendar
  // get finance
  // packages
  const [info, unavailable, finance, packages, pricing, campaign] =
    await Promise.all([
      getConsultantInfo(cid),
      getUnavailableWeekdays(cid),
      getFinanceConfig(),
      getConsultantsPackages(cid, true),
      resolveConsultantPricing(cid),
      getCampaignFor("CONSULTANT_BADGE"),
    ]);

  // get user wallet
  // const wallet = await getWalletByAuthor(user?.id ?? "");

  // validate
  if (!pricing || !finance || !info) return null;

  const { cost, original, discount } = pricing;

  return (
    <div className="max-w-6xl mx-auto py-5 space-y-8">
      {discount && (
        <div className="w-fit mx-auto">
          <DiscountBadge campaign={campaign} price={cost[30]} />
        </div>
      )}

      <Reservation
        cid={cid}
        cost={cost}
        original={original}
        user={user}
        packages={packages}
        consultant={info?.name}
        finance={finance}
        unavailable={[...unavailable]}
        collaboration={collaboration}
        discount={discount}
      />

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
