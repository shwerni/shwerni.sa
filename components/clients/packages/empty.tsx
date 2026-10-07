// React & Next
import Link from "next/link";

// components
import { Button } from "@/components/ui/button";

// icons
import { Package, RotateCcw } from "lucide-react";

// props
interface Props {
  search: string;
  filtered: boolean;
}

// no packages: a search miss, filters that match nothing, or no packages at all
export function PackagesEmpty({ search, filtered }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-theme-50">
        <Package className="h-10 w-10 text-theme-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700">
        {search
          ? `لا توجد باقات لمستشار باسم "${search}"`
          : filtered
            ? "لا توجد باقات مطابقة"
            : "لا توجد باقات متاحة حالياً"}
      </h3>
      {filtered && (
        <>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            جرّب تعديل البحث أو الفلاتر لعرض المزيد من الباقات.
          </p>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link href="/packages">
              <RotateCcw className="h-4 w-4" />
              مسح الفلاتر
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
