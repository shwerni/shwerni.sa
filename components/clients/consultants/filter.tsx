"use client";
// React & Next
import React, { useTransition } from "react";

// packages
import { parseAsString, useQueryState, parseAsArrayOf } from "nuqs";

// components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { IconLabel } from "@/components/shared/icon-label";

// utils
import { cn } from "@/lib/utils";
import { findCategory, genderLabel } from "@/utils";

// prisma types
import { Categories, Gender, Specialty } from "@/lib/generated/prisma/browser";

// icons
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Search from "./reservation/search";

// props
interface Props {
  children: React.ReactNode;
}

const Filter = ({ children }: Props) => {
  // open state
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mt-3 md:mt-5">
      {/* desktop */}
      <div className="hidden md:flex flex-col gap-5 p-3 border-l border-gray-200">
        <h6 className="text-theme text-xl font-medium">فلترة المستشارون</h6>
        {children}
      </div>
      {/* mobile */}
      <DropdownMenu dir="rtl" onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild className="block md:hidden w-fit">
          <div className="py-2 px-3 hover:underlines">
            <IconLabel
              Icon={ChevronLeft}
              label="فلترة المستشارون "
              className="text-theme text-xl font-medium"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60 p-3" align="start">
          <DropdownMenuGroup>{children}</DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Filter;

export const FilterContent = ({
  specialties,
}: {
  specialties: Specialty[];
}) => {
  // router
  const router = useRouter();

  // transition — prevents UI freeze during server re-render
  const [isPending, startTransition] = useTransition();

  // gender
  const [gender, setGender] = useQueryState(
    "gender",
    parseAsArrayOf(parseAsString)
      .withDefault(Object.values(Gender))
      .withOptions({
        clearOnDefault: true,
        shallow: false,
        startTransition, // ← non-urgent navigation
      }),
  );

  // categories
  const [categories, setCategories] = useQueryState(
    "categories",
    parseAsArrayOf(parseAsString)
      .withDefault(Object.values(Categories))
      .withOptions({
        clearOnDefault: true,
        shallow: false,
        startTransition, // ← non-urgent navigation
      }),
  );

  // select gender
  function toggleGender(id: Gender) {
    setGender((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        return next.length ? next : null;
      } else {
        return [...prev, id];
      }
    });
  }

  // select category
  function toggleCategories(id: Categories) {
    setCategories((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        return next.length ? next : null;
      } else {
        return [...prev, id];
      }
    });
  }

  // handle clear filters
  const clearFilters = () => {
    router.push("/consultants");
  };

  return (
    // dim entire filter while server is re-rendering
    <div
      className={cn(
        "space-y-4",
        isPending && "opacity-50 pointer-events-none transition-opacity",
      )}
    >
      {/* search for desktop */}
      <div className="hidden md:block">
        <Search />
      </div>

      {/* categories */}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-2"
      >
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-theme-700 text-base font-medium">
            التخصص
          </AccordionTrigger>
          <AccordionContent className="">
            <div className="flex flex-col gap-3">
              {/* categories */}
              {Object.values(Categories).map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3",
                    !categories.includes(i) && "opacity-35",
                  )}
                >
                  <Checkbox
                    id={i}
                    value={i}
                    checked={categories.includes(i)}
                    onCheckedChange={() => toggleCategories(i)}
                  />
                  <Label htmlFor={i} className="text-sm">
                    {findCategory(i)?.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* separator */}
      <Separator className="w-3/4 mx-auto" />

      {/* gender */}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-3"
      >
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-theme-700 text-base font-medium">
            الجنس
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <div className="flex flex-col gap-3">
              {/* genders */}
              {Object.values(Gender).map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3",
                    !gender.includes(i) && "opacity-35",
                  )}
                >
                  <Checkbox
                    id={i}
                    value={i}
                    checked={gender.includes(i)}
                    onCheckedChange={() => toggleGender(i)}
                  />
                  <Label htmlFor={i} className="text-sm">
                    {genderLabel(i)}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* separator */}
      <Separator className="w-10/12 mx-auto" />

      {/* reset button */}
      <div className="flex justify-center">
        <Button variant="primary" onClick={clearFilters} className="w-11/12">
          جميع التصنيفات
        </Button>
      </div>
    </div>
  );
};
