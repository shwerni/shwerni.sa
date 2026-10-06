// React & Next
import Link from "next/link";

// components
import {
  EmptyState,
  PageHeader,
  Panel,
  StatTile,
  sar,
} from "@/components/center-dashboard/ui";

// prisma data
import { getCenterDues } from "@/data/center/dues";
import { requireCenter } from "@/data/center/require-center";
import { getCenterOverview } from "@/data/center/dashboard";

// constants
import { itimes } from "@/constants";

// utils
import { getDayName, riyadhDateString } from "@/utils/date";

// icons
import {
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  WalletCards,
} from "lucide-react";

// overview: this month's earned, the balance, pending approvals, today's and upcoming bookings
export default async function Page() {
  const ctx = await requireCenter().catch(() => null);
  if (!ctx) return null;

  const [overview, dues] = await Promise.all([
    getCenterOverview(ctx.centerId),
    getCenterDues(ctx.centerId),
  ]);

  // this month (riyadh), from the dues rows
  const month = overview.today.slice(0, 7);
  const monthEarned = (dues?.orders ?? [])
    .filter((o) => riyadhDateString(o.due_at).slice(0, 7) === month)
    .reduce((sum, o) => sum + o.net, 0);

  const todaySessions = overview.sessions.filter((s) => s.date === overview.today);
  const upcoming = overview.sessions.filter((s) => s.date !== overview.today);

  const SessionList = ({ list }: { list: typeof overview.sessions }) => (
    <ul className="divide-y divide-border/60">
      {list.map((s) => (
        <li key={s.mid}>
          <Link
            href={`/center/orders/${s.orders.oid}`}
            className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-(--center-primary)"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{s.orders.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {s.orders.consultant.name} · {s.duration} دقيقة
              </p>
            </div>
            <div className="shrink-0 text-end text-xs text-muted-foreground">
              <p>{getDayName(s.date)} {s.date.slice(5).replace("-", "/")}</p>
              <p>{itimes[s.time]?.label ?? s.time}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <PageHeader title="نظرة عامة" description="ملخص حجوزات المركز ومستحقاته" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="مستحقات هذا الشهر" value={sar(monthEarned)} icon={WalletCards} />
        <StatTile label="الرصيد الحالي" value={sar(dues?.balance ?? 0)} icon={Wallet} />
        <div className="col-span-2 lg:col-span-1">
          <StatTile
            label="بانتظار الموافقة"
            value={overview.pendingApprovals}
            icon={ClipboardCheck}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="حجوزات اليوم" icon={CalendarClock}>
          {todaySessions.length ? (
            <SessionList list={todaySessions} />
          ) : (
            <EmptyState icon={CalendarClock} text="لا توجد حجوزات اليوم" />
          )}
        </Panel>
        <Panel title="الحجوزات القادمة" icon={CalendarDays}>
          {upcoming.length ? (
            <SessionList list={upcoming} />
          ) : (
            <EmptyState icon={CalendarDays} text="لا توجد حجوزات قادمة" />
          )}
        </Panel>
      </div>
    </div>
  );
}
