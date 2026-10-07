"use client";
// React & Next
import React from "react";

// packages
import { parseAsInteger, useQueryState } from "nuqs";

// components
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

// icons
import { ChevronLeftIcon, ChevronRightIcon, Package } from "lucide-react";

// props
interface Props {
  total: number;
  pages: number;
  current: number;
  label: string;
}

// /packages pagination (same layout as the coupons page)
export function PackagesNavigation({ current, total, pages, label }: Props) {
  const [, startTransition] = React.useTransition();
  const [, setPage] = useQueryState(
    "page",
    parseAsInteger
      .withDefault(1)
      .withOptions({ shallow: false, scroll: true, startTransition }),
  );

  const go = (n: number) => setPage(n <= 1 ? null : n);

  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-4">
      {pages > 1 && (
        <Pagination dir="ltr">
          <PaginationContent>
            {current > 2 && (
              <>
                <Button
                  aria-label="الصفحة السابقة"
                  onClick={() => go(current - 1)}
                  variant="outline"
                >
                  <ChevronLeftIcon />
                </Button>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              </>
            )}
            {current !== 1 && (
              <PaginationItem>
                <Button onClick={() => go(current - 1)} variant="outline">
                  {current - 1}
                </Button>
              </PaginationItem>
            )}
            <PaginationItem>
              <Button variant="primary">{current}</Button>
            </PaginationItem>
            {pages - current !== 0 && (
              <PaginationItem>
                <Button onClick={() => go(current + 1)} variant="outline">
                  {current + 1}
                </Button>
              </PaginationItem>
            )}
            {pages - current > 1 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <Button
                  aria-label="الصفحة التالية"
                  onClick={() => go(current + 1)}
                  variant="outline"
                >
                  <ChevronRightIcon />
                </Button>
              </>
            )}
          </PaginationContent>
        </Pagination>
      )}

      <h6 className="inline-flex items-center gap-1.5 text-sm text-gray-500">
        {label}
        <Package className="w-4" />
        <span className="font-semibold">{total}</span>
      </h6>
    </div>
  );
}
