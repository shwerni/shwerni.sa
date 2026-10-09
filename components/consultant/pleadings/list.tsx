// React & Next
import Link from "next/link";

// packages
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// components
import { PleadingStateBadge } from "@/components/clients/pleading/state-badge";

// prisma types
import { PleadingState, UserRole } from "@/lib/generated/prisma/enums";

// types
import type { listConsultantPleadings } from "@/data/pleading";

// icons
import { Scale } from "lucide-react";

type Item = NonNullable<Awaited<ReturnType<typeof listConsultantPleadings>>>[number];

// the list, grouped by state: what needs the consultant first, closed cases last
const groups: { title: string; states: PleadingState[] }[] = [
  { title: "بانتظار ردك", states: [PleadingState.REQUESTED] },
  { title: "بانتظار دفع العميل", states: [PleadingState.QUOTED] },
  { title: "مدفوعة", states: [PleadingState.PAID] },
  {
    title: "مغلقة",
    states: [
      PleadingState.DECLINED,
      PleadingState.EXPIRED,
      PleadingState.CANCELED,
    ],
  },
];

function lastMessagePreview(msg: Item["lastMessage"]) {
  if (!msg) return "لا توجد رسائل بعد";
  const prefix = msg.sender === UserRole.OWNER ? "أنت: " : "";
  if (msg.fileType?.startsWith("image/")) return `${prefix}📷 صورة`;
  if (msg.fileType) return `${prefix}📎 ملف مرفق`;
  return `${prefix}${msg.content}`;
}

function PleadingRow({ item }: { item: Item }) {
  const ago = item.lastMessage
    ? formatDistanceToNow(item.lastMessage.createdAt, {
        addSuffix: true,
        locale: ar,
      })
    : "";

  return (
    <Link href={`/dashboard/pleadings/${item.plid}`} className="group block">
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 border-b border-slate-100 last:border-0">
        {/* client initial (never the phone) */}
        <div className="w-12 h-12 rounded-full shrink-0 ring-2 ring-white shadow bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-lg">
          {item.name?.[0] ?? "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900 text-sm truncate">
              {item.name}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
              {ago}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-slate-500 truncate leading-relaxed">
              {lastMessagePreview(item.lastMessage)}
            </p>
            {item.clientMessages > 0 && (
              <span
                title="رسائل العميل"
                className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-theme text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
              >
                {item.clientMessages > 99 ? "99+" : item.clientMessages}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
              طلب #{item.plid}
            </span>
            <PleadingStateBadge
              state={item.state}
              className="text-[10px] px-1.5 py-0.5"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

// the consultant's pleading cases (expired ones are already persisted as EXPIRED by the query)
export function PleadingsList({ items }: { items: Item[] }) {
  if (!items.length)
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-400 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Scale className="w-7 h-7" />
        </div>
        <div>
          <p className="font-semibold text-slate-600 text-base">
            لا توجد طلبات مرافعة بعد
          </p>
          <p className="text-sm mt-1 text-slate-400">
            تظهر هنا طلبات العملاء عند تفعيل استقبال طلبات المرافعة من الإعدادات
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const rows = items.filter((i) => group.states.includes(i.state));
        if (!rows.length) return null;

        return (
          <section key={group.title} className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-600 px-1">
              {group.title}
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium tabular-nums">
                {rows.length}
              </span>
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {rows.map((item) => (
                <PleadingRow key={item.plid} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
