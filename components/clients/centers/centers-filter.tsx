"use client";
// React & Next
import { useTransition } from "react";

// packages
import { parseAsString, useQueryState } from "nuqs";

// utils
import { cn } from "@/utils/utils";

// props
interface Props {
  cities: string[];
}

// city filter for /centers (server-rendered list, so shallow: false)
export function CentersFilter({ cities }: Props) {
  const [isPending, startTransition] = useTransition();
  const [city, setCity] = useQueryState(
    "city",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition }),
  );

  if (cities.length < 2) return null;

  const options = [{ value: "", label: "كل المدن" }].concat(
    cities.map((c) => ({ value: c, label: c })),
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 transition-opacity",
        isPending && "opacity-60",
      )}
    >
      {options.map((o) => (
        <button
          key={o.value || "all"}
          type="button"
          onClick={() => setCity(o.value || null)}
          aria-pressed={city === o.value}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition",
            city === o.value
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
