// React & Next
import Link from "next/link";
import { notFound } from "next/navigation";

// components
import { PageHeader, Panel, sar } from "@/components/center-dashboard/ui";

// prisma data
import { getCenterOrder } from "@/data/center/dashboard";
import { requireCenter } from "@/data/center/require-center";

// constants
import { itimes } from "@/constants";

// utils
import { cn } from "@/utils/utils";
import { getDayName, riyadhDateString } from "@/utils/date";
import { findPayment, paymentMethodLabel } from "@/utils";
import { withTax } from "@/utils/tax";

// icons
import { ArrowRight, CalendarDays, ReceiptText, UserRound } from "lucide-react";

// props
interface Props {
  params: Promise<{ oid: string }>;
}

// read-only order detail. the order must belong to this center (another center's id reads as
// missing); the client is shown by name only, like the consultant dashboard
export default async function Page({ params }: Props) {
  const ctx = await requireCenter().catch(() => null);
  if (!ctx) return null;

  const { oid } = await params;
  const order = await getCenterOrder(ctx.centerId, Number(oid));
  if (!order) notFound();

  const status = order.payment ? findPayment(order.payment.payment) : undefined;
  const refunded = order.refunds.reduce((sum, r) => sum + r.amount, 0);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );

  return (
    <div>
      <Link
        href="/center/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" strokeWidth={1.75} />
        الطلبات
      </Link>
      <PageHeader
        title={`طلب #${order.oid}`}
        description={`أُنشئ ${riyadhDateString(order.created_at)}`}
        actions={
          status && (
            <span className={cn("rounded-full px-3 py-1 text-xs", status.style)}>
              {status.label}
            </span>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="العميل والمستشار" icon={UserRound}>
          <div className="divide-y divide-border/60">
            <Row label="العميل" value={order.name} />
            <Row label="المستشار" value={order.consultant.name} />
            <Row label="عدد الجلسات" value={order.sessionCount} />
          </div>
        </Panel>

        <Panel title="الدفع" icon={ReceiptText}>
          {order.payment ? (
            <div className="divide-y divide-border/60">
              <Row label="طريقة الدفع" value={paymentMethodLabel(order.payment.method) ?? "—"} />
              <Row label="المبلغ قبل الضريبة" value={sar(order.payment.total)} />
              <Row label="المبلغ شامل الضريبة" value={sar(withTax(order.payment.total))} />
              {order.payment.usedCoupon && (
                <Row
                  label="كوبون"
                  value={`${order.payment.usedCoupon.code} (${order.payment.usedCoupon.discount}%)`}
                />
              )}
              {order.payment.centerShare != null && (
                <Row label="حصة المركز" value={sar(order.payment.centerShare)} />
              )}
              {refunded > 0 && <Row label="المسترد" value={sar(refunded)} />}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد بيانات دفع</p>
          )}
        </Panel>

        <Panel title="الجلسات" icon={CalendarDays} className="lg:col-span-2">
          <ul className="divide-y divide-border/60">
            {order.meeting.map((m) => (
              <li key={m.mid} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  الجلسة {m.session} · {getDayName(m.date)} {m.date}
                </span>
                <span className="text-muted-foreground">
                  {itimes[m.time]?.label ?? m.time} · {m.duration} دقيقة
                  {m.done && " · تمت"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
