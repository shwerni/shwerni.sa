"use client";
// React & Next
import React from "react";

// packages
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

// components
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/browser";

// utils
import { cn } from "@/utils/utils";
import { findPayment } from "@/utils";

// icons
import { RotateCcw, Search } from "lucide-react";

// props
interface Props {
  consultants: { cid: number; name: string }[];
}

const ALL = "all";

// orders filters in the url (server-rendered list, so shallow: false); any change goes back to page 1
export function OrdersFilters({ consultants }: Props) {
  const [isPending, startTransition] = React.useTransition();
  const [params, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      cid: parseAsInteger.withDefault(0),
      from: parseAsString.withDefault(""),
      to: parseAsString.withDefault(""),
      state: parseAsString.withDefault(""),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, startTransition },
  );
  const [q, setQ] = React.useState(params.q);

  const set = (patch: Partial<typeof params>) =>
    setParams({ ...patch, page: null } as never);

  const field = "h-9 rounded-xl";

  return (
    <div
      className={cn(
        "mb-4 grid gap-2 transition-opacity sm:grid-cols-2 lg:grid-cols-5",
        isPending && "opacity-60",
      )}
    >
      <form
        className="relative sm:col-span-2 lg:col-span-1"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: q.trim() || null } as never);
        }}
      >
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => q.trim() !== params.q && set({ q: q.trim() || null } as never)}
          placeholder="رقم الطلب أو اسم العميل"
          aria-label="بحث"
          className={cn(field, "ps-9")}
        />
      </form>

      <Select
        value={params.cid ? String(params.cid) : ALL}
        onValueChange={(v) => set({ cid: v === ALL ? null : Number(v) } as never)}
        dir="rtl"
      >
        <SelectTrigger className={cn(field, "w-full")} aria-label="المستشار">
          <SelectValue placeholder="كل المستشارين" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>كل المستشارين</SelectItem>
          {consultants.map((c) => (
            <SelectItem key={c.cid} value={String(c.cid)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.state || ALL}
        onValueChange={(v) => set({ state: v === ALL ? null : v } as never)}
        dir="rtl"
      >
        <SelectTrigger className={cn(field, "w-full")} aria-label="حالة الدفع">
          <SelectValue placeholder="كل الحالات" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>كل الحالات</SelectItem>
          {Object.values(PaymentState).map((s) => (
            <SelectItem key={s} value={s}>
              {findPayment(s)?.label ?? s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
        <Input
          type="date"
          value={params.from}
          onChange={(e) => set({ from: e.target.value || null } as never)}
          aria-label="من تاريخ الجلسة"
          className={field}
        />
        <span className="text-xs text-muted-foreground">إلى</span>
        <Input
          type="date"
          value={params.to}
          onChange={(e) => set({ to: e.target.value || null } as never)}
          aria-label="إلى تاريخ الجلسة"
          className={field}
        />
        <button
          type="button"
          onClick={() => {
            setQ("");
            setParams(null);
          }}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="مسح الفلاتر"
        >
          <RotateCcw className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
