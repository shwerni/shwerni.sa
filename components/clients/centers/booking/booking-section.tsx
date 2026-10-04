// components
import { BookingPanel } from "@/components/clients/centers/booking/booking-panel";

// prisma data
import {
  getConsultantInfoForBooking,
  getUnavailableWeekdays,
} from "@/data/consultant";
import { resolveConsultantPricing } from "@/data/event";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// lib
import { userServer } from "@/lib/auth/server";

// props
interface Props {
  cid: number;
}

// booking for a center consultant: the same server pipeline as the platform
// (getConsultantInfoForBooking, resolveConsultantPricing, then the Pay action), never cached
export async function BookingSection({ cid }: Props) {
  const [user, info, pricing, unavailable, finance] = await Promise.all([
    userServer(),
    getConsultantInfoForBooking(cid),
    resolveConsultantPricing(cid),
    getUnavailableWeekdays(cid),
    getFinanceConfig(),
  ]);

  if (!info || !pricing || !finance)
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
        الحجز غير متاح حالياً، برجاء المحاولة لاحقاً
      </div>
    );

  return (
    <BookingPanel
      cid={cid}
      consultant={info.name}
      cost={pricing.cost}
      original={pricing.original}
      discountedDurations={pricing.discount?.durations ?? []}
      unavailable={[...unavailable]}
      finance={finance}
      user={user ? { id: user.id, name: user.name ?? "", phone: user.phone ?? "" } : null}
    />
  );
}
