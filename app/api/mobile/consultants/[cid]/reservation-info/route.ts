// lib
import { createGetRoute } from "@/lib/api/routes/route-factory";

// prisma data
import {
  getConsultantCost,
  getConsultantInfo,
  getUnavailableWeekdays,
} from "@/data/consultant";
import { getFinanceConfig } from "@/data/admin/settings/finance";

export const GET = createGetRoute<unknown, { cid: string }>(
  async (_request, { params }) => {
    const { cid: cidParam } = await params;
    const cid = Number(cidParam);

    if (!cid) {
      return { error: "معرف الاستشاري غير صحيح" };
    }

    const [info, unavailable, cost, finance] = await Promise.all([
      getConsultantInfo(cid),
      getUnavailableWeekdays(cid),
      getConsultantCost(cid),
      getFinanceConfig(),
    ]);

    if (!info || !cost || !finance) return { error: "الاستشاري غير متاح" };

    // active discount check, same rule as web (discountId 3)
    // const isDiscount = info.DiscountConsultant.some(
    //   (d) => d.discountId === 3 && d.status,
    // );

    // if (isDiscount) cost[30] = 86.5;

    return {
      consultant: info.name,
      cost,
      finance,
      unavailable: [...unavailable],
      isDiscount: undefined,
    };
  },
);
