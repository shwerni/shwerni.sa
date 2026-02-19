"use client";
// React & Next
import React from "react";

// packages
import {
  parseAsString,
  useQueryState,
  parseAsArrayOf,
  parseAsStringEnum,
} from "nuqs";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconLabel } from "@/components/shared/icon-label";
import SearchInput from "@/components/clients/shared/search-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// utils
import { cn } from "@/lib/utils";
import { findCategory } from "@/utils";

// prisma types
import { Categories, Specialty } from "@/lib/generated/prisma/browser";

// hooks
import { useDebounced } from "@/hooks/debounced";

// icons
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
      <div className="hidden md:flex flex-col gap-5  p-3 border-l border-gray-200">
        <h6 className="text-[#117ED8] text-xl font-medium">فلترة البرامج</h6>
        {children}
      </div>
      {/* mobile */}
      <DropdownMenu dir="rtl" onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild className="block md:hidden">
          <div className="py-2 px-3 hover:underlines">
            <IconLabel
              Icon={ChevronLeft}
              label="فلترة البرامج "
              className="text-[#117ED8] text-xl font-medium"
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

  // order object
  const orderType = {
    newest: "newest",
    viral: "viral",
  } as const;

  // order type
  type OrderType = (typeof orderType)[keyof typeof orderType];

  // search
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
    shallow: false,
  });

  // local input state
  const [searchInput, setSearchInput] = React.useState(search);

  // debounce
  const debounced = useDebounced(searchInput, 500);

  // specialties
  const [specialtiesIds, setSpecialtiesIds] = useQueryState(
    "specialties",
    parseAsArrayOf(parseAsString).withDefault([]).withOptions({
      clearOnDefault: true,
      shallow: false,
    }),
  );

  // specialties
  const [categories, setCategories] = useQueryState(
    "categories",
    parseAsArrayOf(parseAsString)
      .withDefault(Object.values(Categories))
      .withOptions({
        clearOnDefault: true,
        shallow: false,
      }),
  );

  // search
  const [orderBy, setOrderBy] = useQueryState(
    "orderby",
    parseAsStringEnum<OrderType>(Object.values(orderType))
      .withDefault("newest")
      .withOptions({
        clearOnDefault: true,
        shallow: false,
      }),
  );

  // select specialty
  function toggleSpecialty(id: string) {
    setSpecialtiesIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
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

  // update search
  function updateSearch(value: string | null) {
    setSearch(value?.trim() || null);
  }

  // update radio group
  function updateRadio(value: "newest" | "viral") {
    if (value === "newest" || value === "viral") setOrderBy(value);
  }
  // check specialties safety
  const allowedIds = new Set(specialties.map((s) => s.id));

  // safe specialties
  const safeSpecialties = specialtiesIds.filter((id) => allowedIds.has(id));

  // handle clear flters
  const clearFilters = () => {
    router.push("/consultants");
  };

  // update local search
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  React.useEffect(() => {
    // debounced search
    updateSearch(debounced || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, setSearch]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="w-11/12 space-y-3">
        <Label>البحث</Label>
        <SearchInput
          defaultValue={searchInput}
          placeholder="...ابحث"
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      {/* order by */}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-1"
      >
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-[#094577] text-base font-medium">
            التصنيف حسب
          </AccordionTrigger>
          <AccordionContent className="">
            <RadioGroup
              dir="rtl"
              defaultValue="newest"
              value={orderBy}
              onValueChange={updateRadio}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="newest" id="r1" />
                <Label htmlFor="r1">الأحدث</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="viral" id="r2" />
                <Label htmlFor="r2">الأكثر مراجعات</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* separator */}
      <Separator className="w-3/4 mx-auto" />
      {/* categories */}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-2"
      >
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-[#094577] text-base font-medium">
            التخصص
          </AccordionTrigger>
          <AccordionContent className="">
            <div className="flex flex-col gap-3">
              {/* genders */}
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
                    {findCategory(i)?.category}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* separator */}
      <Separator className="w-3/4 mx-auto" />
      {/* specialties */}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-6"
      >
        <AccordionItem value="item-6">
          <AccordionTrigger className="text-[#094577] text-base font-medium">
            التصنيفات المفتاحية
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <ScrollArea className="h-40 gap-y-20" dir="rtl">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="all"
                    checked={
                      safeSpecialties.length == 0 ||
                      safeSpecialties.length == specialties.length
                    }
                    onCheckedChange={() => setSpecialtiesIds([])}
                  />
                  <Label htmlFor="all" className="text-sm">
                    اختيار الكل
                  </Label>
                </div>
                {/* all specialties */}
                {specialties.map((i) => (
                  <div
                    key={i.id}
                    className={cn(
                      "flex items-center gap-3",
                      !safeSpecialties.includes(i.id) && "opacity-35",
                    )}
                  >
                    <Checkbox
                      id={i.id}
                      value={i.id}
                      checked={
                        safeSpecialties.includes(i.id) ||
                        safeSpecialties.length == 0
                      }
                      onCheckedChange={() => toggleSpecialty(i.id)}
                    />
                    <Label htmlFor={i.name} className="text-sm">
                      {i.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
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
