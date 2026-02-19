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
import { BookOpen, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// props
interface Props {
  total: number;
  pages: number;
  current: number;
}

const Navigation = ({ current, total, pages }: Props) => {
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

  return (
    <div className="flex flex-col items-center justify-center gap-3 col-span-6">
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
        عدد المقالات
        <BookOpen className="w-5" />
        <span className="font-semibold">{total}</span>
      </h6>
    </div>
  );
};

export default Navigation;
