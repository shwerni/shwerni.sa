"use client";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/app/_components/layout/badge/owner";
import LoadingBtn from "@/app/_components/layout/loadingBtn";

import { updateConsultantSpecialties } from "@/data/specialty";

import { cn } from "@/lib/utils";

import { Categories } from "@/lib/generated/prisma/enums";
import { Specialty } from "@/lib/generated/prisma/client";

interface Props {
  cid: number;
  specialties: Pick<Specialty, "name" | "id">[];
  category: Categories;
  iSelected?: string[];
}

export default function Specialties({
  cid,
  specialties,
  category,
  iSelected = [],
}: Props) {
  const [selected, setSelected] = useState<string[]>(iSelected);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    const updated = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];

    setSelected(updated);
  };

  const selectAll = () => {
    const allIds = specialties.map((s) => s.id);
    setSelected(allIds);
  };

  const removeAll = () => {
    setSelected([]);
  };

  const update = () => {
    startTransition(async () => {
      await updateConsultantSpecialties(cid, selected);
    });
  };

  return (
    <div className="p-5 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h3 className="text-lg font-semibold">اختر التخصصات المناسبة</h3>
          <CategoryBadge category={category} />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-base px-3 py-1 rounded-full border hover:bg-gray-50 bg-white"
          >
            اختيار الكل
          </button>

          <button
            type="button"
            onClick={removeAll}
            className="text-base px-3 py-1 rounded-full border text-red-600 hover:bg-red-50 bg-white"
          >
            إزالة الكل
          </button>
        </div>
      </div>

      {/* specialties */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {specialties.map((item) => {
          const isActive = selected.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              disabled={isPending}
              onClick={() => toggle(item.id)}
              className={cn(
                "w-fit px-4 py-2 rounded-full border text-base transition",
                "text-right",
                isActive
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                isPending && "opacity-60 cursor-not-allowed",
              )}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* save */}
      <Button className="bg-zblue-200" onClick={update}>
        <LoadingBtn loading={isPending}>حفظ التغيرات</LoadingBtn>
      </Button>
    </div>
  );
}
