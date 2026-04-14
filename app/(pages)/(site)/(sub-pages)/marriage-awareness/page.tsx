import {
  getConsultant,
  getConsultantCost,
  getConsultantInfo,
  getUnavailableWeekdays,
} from "@/data/consultant";
import ConsultantMiniCard from "./card";
import AwarenessForm from "./form";
import ProductCard from "./product";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getFinanceConfig } from "@/data/admin/settings/finance";
import Error404 from "@/components/shared/error-404";

export default async function Page() {
  const session = await auth();

  const cid = 97;

  // fetch the specific consultant who runs this assessment
  const consultant = await getConsultant(cid);

  // get consultant info
  const info = await getConsultantInfo(cid);

  // get unavailable week days to exclude form calendar
  const unavailable = await getUnavailableWeekdays(cid);

  // get consultant cost
  const cost = 304;

  // get finance
  const finance = await getFinanceConfig();

  if (!consultant || !cost) return <Error404 />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <ConsultantMiniCard consultant={consultant} />

      <ProductCard />

      <AwarenessForm
        cid={consultant.cid}
        consultant={consultant.name}
        unavailable={unavailable}
        cost={cost}
        finance={finance}
        user={session?.user}
      />
    </div>
  );
}
