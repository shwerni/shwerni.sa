"use client";
import { useQueryState } from "nuqs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, Ticket } from "lucide-react";

interface Props {
  total: number;
  pages: number;
  current: number;
}

const CouponsNavigation = ({ current, total, pages }: Props) => {
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

  if (pages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-8">
      <Pagination dir="ltr">
        <PaginationContent>
          {current > 2 && (
            <>
              <Button onClick={() => setPage(page - 1)} variant="outline">
                <ChevronLeftIcon />
              </Button>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}
          {current !== 1 && (
            <PaginationItem>
              <Button onClick={() => setPage(page - 1)} variant="outline">
                {current - 1}
              </Button>
            </PaginationItem>
          )}
          <PaginationItem>
            <Button variant="primary">{current}</Button>
          </PaginationItem>
          {pages - current !== 0 && (
            <PaginationItem>
              <Button onClick={() => setPage(page + 1)} variant="outline">
                {current + 1}
              </Button>
            </PaginationItem>
          )}
          {pages - current > 1 && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <Button onClick={() => setPage(page + 1)} variant="outline">
                <ChevronRightIcon />
              </Button>
            </>
          )}
        </PaginationContent>
      </Pagination>

      <h6 className="inline-flex items-center gap-1.5 text-sm text-gray-500">
        عدد الكوبونات
        <Ticket className="w-4" />
        <span className="font-semibold">{total}</span>
      </h6>
    </div>
  );
};

export default CouponsNavigation;