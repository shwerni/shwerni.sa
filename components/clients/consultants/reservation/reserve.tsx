// componenets
import AddYourReview from "../consultant/post-review";
import Reservation from "@/components/clients/consultants/reservation/form";
import DiscountBadge from "@/components/clients/sub-pages/event/discounts/discount-badge";

// prisma data
import {
  getConsultantCost,
  getConsultantInfo,
  getUnavailableWeekdays,
} from "@/data/consultant";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// lib
import { userServer } from "@/lib/auth/server";
import { getConsultantsPackages } from "@/data/packages";

// icons
import { Clock, Tag } from "lucide-react";

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

  // packages
  const packages = await getConsultantsPackages(cid, true);

  // get user wallet
  // const wallet = await getWalletByAuthor(user?.id ?? "");

  // validate
  if (!cost || !finance || !info) return;

  // discount // dynamic later
  const isDiscount = info?.DiscountConsultant.some(
   (i) => i.discountId === 3 && i.status,
  );

  // cost
  if (isDiscount) cost[30] = 86.5;
  // if (cid === 36) cost[30] = 60;

  return (
    <div className="max-w-6xl mx-auto py-5 space-y-8">
      {/* discount badge  */}
      {isDiscount && (
        <div className="w-fit mx-auto">
          <DiscountBadge />
        </div>
      )}
      {/* {cid === 36 && <SpecialOffer />} */}

      {/* reservation */}
      <Reservation
        cid={cid}
        cost={cost}
        user={user}
        packages={packages}
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

function SpecialOffer() {
  return (
    <div className="flex flex-col items-center gap-2 py-2" dir="rtl">
      {/* limited time badge */}
      <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3.5 py-1">
        <Clock className="w-3.5 h-3.5 text-blue-700" />
        <span className="text-xs font-semibold text-theme">
          عرض لفترة محدودة
        </span>
      </div>

      {/* title */}
      <p className="text-lg font-bold text-slate-800 text-center">
        استشارتك مع الدكتورة عفاف
      </p>

      {/* price row */}
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5 text-theme" />
        <span className="text-3xl font-bold text-theme">69 ريال</span>
        <span className="text-sm text-slate-500">فقط · شامل الضريبة</span>
      </div>
    </div>
  );
}
