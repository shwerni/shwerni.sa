"use client";
// packages
import { useQueryState } from "nuqs";

// components
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

// icons
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcw,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

// props
interface Props {
  total: number;
  pages: number;
  current: number;
}

const Navigation = ({ current, total, pages }: Props) => {
  // router
  const router = useRouter();

  // state
  const [page, setPage] = useQueryState("page", {
    defaultValue: 1,
    parse: (value) => {
      const n = Number(value);
      const s = Number.isInteger(n) && n > 0 ? n : 1;
      return s > pages ? pages : s;
    },
    clearOnDefault: true,
    shallow: false,
  });

  // handle clear flters
  const clearFilters = () => {
    router.push("/consultants");
  };

  return (
    <div className="col-span-6 flex flex-col justify-center items-center gap-8">
      {/* pagination */}
      <div className="flex flex-col items-center justify-center gap-3">
        {/* pagination  */}
        <Pagination dir="ltr">
          <PaginationContent>
            {current > 2 && (
              <>
                {/* previous button */}
                <Button onClick={() => setPage(page - 1)} variant="outline">
                  <ChevronLeftIcon />
                </Button>
                {/* previous ellipsis */}
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              </>
            )}
            {/* previous page*/}
            {current != 1 && (
              <PaginationItem>
                <Button onClick={() => setPage(page - 1)} variant="outline">
                  {current - 1}
                </Button>
              </PaginationItem>
            )}
            {/* current */}
            <PaginationItem>
              <Button variant="primary">{current}</Button>
            </PaginationItem>
            {/* next page */}
            {pages - current != 0 && (
              <PaginationItem>
                <Button onClick={() => setPage(page + 1)} variant="outline">
                  {current + 1}
                </Button>
              </PaginationItem>
            )}
            {pages - current > 1 && (
              <>
                {/* next ellipsis */}
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                {/* next button */}
                <Button onClick={() => setPage(page + 1)} variant="outline">
                  <ChevronRightIcon />
                </Button>
              </>
            )}
          </PaginationContent>
        </Pagination>
        {/* total count */}
        <h6 className="inline-flex items-center gap-1.5 text-sm text-gray-500">
          عدد المستشارون
          <Users className="w-5" />
          <span className="font-semibold">{total}</span>
        </h6>
      </div>
      {/* action */}
      {typeof total === "number" && total > 0 && total <= 17 && (
        <div className="flex flex-col items-center justify-center gap-1.5">
          <span className="text-red-600 font-medium text-sm ">
            النتائج قليلة
          </span>
          <Button onClick={clearFilters} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            جرّب إزالة جميع الفلاتر
          </Button>
        </div>
      )}
    </div>
  );
};

export default Navigation;
