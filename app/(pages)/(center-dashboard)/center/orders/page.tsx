// React & Next
import Link from "next/link";

// components
import { EmptyState, PageHeader, sar } from "@/components/center-dashboard/ui";
import { OrdersFilters } from "@/components/center-dashboard/orders-filters";

// prisma data
import { requireCenter } from "@/data/center/require-center";
import {
  getCenterConsultantOptions,
  getCenterOrders,
} from "@/data/center/dashboard";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// lib
import { centerOrdersCache } from "@/lib/nuqs/center-orders";

// constants
import { itimes } from "@/constants";

// utils
import { cn } from "@/utils/utils";
import { findPayment } from "@/utils";

// icons
import { ChevronLeft, ChevronRight, ReceiptText } from "lucide-react";

// props
interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// the center's orders: search + filters (consultant, session date, payment state), paginated
export default async function Page({ searchParams }: Props) {
  const ctx = await requireCenter().catch(() => null);
  if (!ctx) return null;

  const p = await centerOrdersCache.parse(searchParams);
  const state = (Object.values(PaymentState) as string[]).includes(p.state)
    ? (p.state as PaymentState)
    : "";
  const dateOk = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "");

  const [consultants, result] = await Promise.all([
    getCenterConsultantOptions(ctx.centerId),
    getCenterOrders(ctx.centerId, {
      page: Math.max(1, p.page),
      q: p.q,
      cid: p.cid,
      from: dateOk(p.from),
      to: dateOk(p.to),
      state,
    }),
  ]);

  // keep the filters on the pagination links
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (p.q) params.set("q", p.q);
    if (p.cid) params.set("cid", String(p.cid));
    if (p.from) params.set("from", p.from);
    if (p.to) params.set("to", p.to);
    if (state) params.set("state", state);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/center/orders${qs ? `?${qs}` : ""}`;
  };
  const page = Math.min(Math.max(1, p.page), result.pages);

  return (
    <div>
      <PageHeader title="الطلبات" description={`${result.total} طلب`} />
      <OrdersFilters consultants={consultants} />

      {result.orders.length === 0 ? (
        <EmptyState icon={ReceiptText} text="لا توجد طلبات مطابقة" />
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card">
          {result.orders.map((o) => {
            const status = o.payment ? findPayment(o.payment.payment) : undefined;
            const meeting = o.meeting[0];
            return (
              <li key={o.oid}>
                <Link
                  href={`/center/orders/${o.oid}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{o.oid}</span>
                      <span className="truncate text-sm">{o.name}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.consultant.name}
                      {meeting &&
                        ` · ${meeting.date} · ${itimes[meeting.time]?.label ?? meeting.time}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {status && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px]", status.style)}>
                        {status.label}
                      </span>
                    )}
                    {o.payment?.centerShare != null && (
                      <span className="text-xs text-muted-foreground">
                        {sar(o.payment.centerShare)}
                      </span>
                    )}
                  </div>
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {result.pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2 text-sm" aria-label="الصفحات">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="grid size-9 place-items-center rounded-xl hover:bg-muted" aria-label="السابقة">
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="size-9" />
          )}
          <span className="text-muted-foreground">
            {page} / {result.pages}
          </span>
          {page < result.pages ? (
            <Link href={pageHref(page + 1)} className="grid size-9 place-items-center rounded-xl hover:bg-muted" aria-label="التالية">
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="size-9" />
          )}
        </nav>
      )}
    </div>
  );
}
