"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import { useQueryStates } from "nuqs";

// components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchInput from "@/components/clients/shared/search-input";

// hooks
import { useDebounced } from "@/hooks/debounced";

// nuqs
import { packagesParams } from "@/lib/nuqs/packages";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/browser";

// constants
import {
  PACKAGE_SESSION_COUNTS,
  PACKAGE_SORTS,
  PACKAGE_SORT_LABELS,
  PackageSort,
  PackageView,
} from "@/constants/packages";

// utils
import { cn } from "@/utils/utils";
import { consultantGenderLabel, findCategory } from "@/utils";

// icons
import { LayoutGrid, RotateCcw, Users } from "lucide-react";

const VIEWS: { value: PackageView; label: string; icon: typeof Users }[] = [
  { value: "packages", label: "حسب الباقة", icon: LayoutGrid },
  { value: "consultants", label: "حسب المستشار", icon: Users },
];

// a toggle chip
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-theme-700 bg-theme-50 text-theme-700"
          : "border-[#E5E7EB] text-gray-600 hover:border-theme-700/40",
      )}
    >
      {children}
    </button>
  );
}

// toggle one value in a list filter; an empty list clears the param ("all")
function toggle<T>(list: T[], value: T) {
  const next = list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
  return next.length ? next : null;
}

// /packages filters in the url (server-rendered list, so shallow: false); any change goes back to page 1
export function PackagesFilters() {
  const [isPending, startTransition] = React.useTransition();
  const [params, setParams] = useQueryStates(packagesParams, {
    shallow: false,
    startTransition,
  });

  // debounced search, kept in sync when the url changes (clear filters, back)
  const [q, setQ] = React.useState(params.search);
  const debounced = useDebounced(q, 500);

  React.useEffect(() => {
    setQ(params.search);
  }, [params.search]);

  React.useEffect(() => {
    const value = debounced.trim();
    if (value !== params.search) setParams({ search: value || null, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const filtered =
    !!params.search ||
    params.category.length > 0 ||
    params.gender.length > 0 ||
    params.sessions.length > 0 ||
    params.sort !== "recommended";

  return (
    <div
      className={cn(
        "space-y-4 transition-opacity",
        isPending && "pointer-events-none opacity-60",
      )}
    >
      {/* view + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="طريقة العرض"
          className="inline-flex rounded-lg border border-[#E5E7EB] p-1"
        >
          {VIEWS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={params.view === value}
              onClick={() =>
                setParams({
                  view: value === "packages" ? null : value,
                  page: null,
                })
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                params.view === value
                  ? "bg-theme text-background"
                  : "text-gray-600 hover:text-theme-700",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        <Select
          dir="rtl"
          value={params.sort}
          onValueChange={(v) =>
            setParams({
              sort: v === "recommended" ? null : (v as PackageSort),
              page: null,
            })
          }
        >
          <SelectTrigger className="w-44" aria-label="الترتيب">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PACKAGE_SORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {PACKAGE_SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* search */}
      <div className="max-w-sm">
        <SearchInput
          value={q}
          placeholder="ابحث باسم المستشار..."
          aria-label="البحث باسم المستشار"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* category, gender, sessions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {Object.values(Categories).map((c) => (
            <Chip
              key={c}
              active={params.category.includes(c)}
              onClick={() =>
                setParams({ category: toggle(params.category, c), page: null })
              }
            >
              {findCategory(c)?.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.values(Gender).map((g) => (
            <Chip
              key={g}
              active={params.gender.includes(g)}
              onClick={() =>
                setParams({ gender: toggle(params.gender, g), page: null })
              }
            >
              {consultantGenderLabel(g)}
            </Chip>
          ))}

          <span className="mx-1 h-5 w-px bg-[#E5E7EB]" aria-hidden />

          {PACKAGE_SESSION_COUNTS.map((n) => (
            <Chip
              key={n}
              active={params.sessions.includes(n)}
              onClick={() =>
                setParams({ sessions: toggle(params.sessions, n), page: null })
              }
            >
              {n} جلسات
            </Chip>
          ))}

          {filtered && (
            <Link
              href={params.view === "consultants" ? "/packages?view=consultants" : "/packages"}
              className="inline-flex items-center gap-1.5 px-2 text-sm text-gray-500 hover:text-theme-700"
            >
              <RotateCcw className="size-3.5" />
              مسح الفلاتر
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
