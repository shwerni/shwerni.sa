"use client";
// React & Next
import { useTransition } from "react";

// packages
import { parseAsString, useQueryState } from "nuqs";

// components
import { Button } from "@/components/ui/button";

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
        "flex flex-wrap items-center gap-2 transition-opacity",
        isPending && "opacity-60",
      )}
    >
      {options.map((o) => {
        const active = city === o.value;
        return (
          <Button
            key={o.value || "all"}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            aria-pressed={active}
            onClick={() => setCity(o.value || null)}
            className="h-8 rounded-full px-4 font-normal"
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}
