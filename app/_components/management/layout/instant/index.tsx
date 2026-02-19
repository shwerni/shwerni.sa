"use client";
// React & Next
import React from "react";
import Image from "next/image";

// packages
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// components
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import CurrencyLabel from "@/app/_components/layout/currency/label";

// utils
import { isEnglish } from "@/utils";

// prisma types
import {  Gender, UserRole } from "@/lib/generated/prisma/enums";

// types
import { Lang } from "@/types/types";
import { Consultant, Instant } from "@/lib/generated/prisma/client";

// type
type FinalInstant = Consultant & {
  online_at: Date | null;
  cost: number | null;
};

// props
interface Props {
  role: UserRole;
  lang?: Lang;
  instants: FinalInstant[] | null;
}

// return
const AllInstants: React.FC<Props> = ({ role, lang, instants }) => {
  // fetch
  const getConsultants = async () => {
    const response = await fetch("/api/instant");
    const data: Instant[] = await response.json();

    if (!data.length) return null;

    return data;
  };

  // get avalible consultants
  const {
    data: owners,
    error,
    isLoading,
  } = useSWR("/api/instant", () => getConsultants(), {
    refreshInterval: 15000,
    errorRetryCount: 1,
    errorRetryInterval: 10000,
  });

  // time
  const dateTimeToString = (date: Date) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: isEn ? enUS : ar,
    });
  };

  // check language
  const isEn = isEnglish(lang);

  // orders
  const data: FinalInstant[] = instants ?? [];

  // orders
  const columns: ColumnDef<FinalInstant>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: isEn ? "name" : "الاسم",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Image
            src={
              row.original.image
                ? row.original.image
                : row.original.gender === Gender.MALE
                ? "/layout/male.jpg"
                : "/layout/female.jpg"
            }
            alt="owner"
            width={50}
            height={50}
          />
          <div className="rflex gap-1">
            <h6># {row.original.cid}</h6>
            <h6 className="capitalize text-sm">{row.getValue("name")}</h6>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "cost",
      header: isEn ? "cost" : "التكلفة",
      cell: ({ row }) => (
        <CurrencyLabel amount={row.getValue("cost")} variant="sm" />
      ),
    },
    {
      accessorKey: "online_at",
      header: isEn ? "last online" : "اخر ظهور",
      cell: ({ row }) => {
        const isOnline = owners?.some((owner) => owner.consultantId === row.original.cid);

        return (
          <h6>
            {isOnline
              ? isEn
                ? "now"
                : "الآن"
              : dateTimeToString(row.getValue("online_at"))}
          </h6>
        );
      },
    },
    {
      // for searching
      accessorKey: "phone",
      header: "",
      cell: () => null,
      enableHiding: true,
    },
    {
      accessorKey: "online",
      header: isEn ? "online" : "الحاله",
      cell: ({ row }) => {
        const isOnline = owners?.some((owner) => owner.consultantId === row.original.cid);

        return (
          <Badge
            className={`lowercase text-zblack-200 ${
              isOnline ? "bg-green-300" : "bg-red-300"
            }`}
          >
            {isOnline
              ? isEn
                ? "Online"
                : "متصل"
              : isEn
              ? "Offline"
              : "غير متصل"}
          </Badge>
        );
      },
    },
  ];

  // on load
  const [onLoad, startLoading] = React.useTransition();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ phone: false });
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data.sort((a, b) => {
      const aOnline = owners?.some((owner) => owner.consultantId === a.cid);
      const bOnline = owners?.some((owner) => owner.consultantId === b.cid);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      if (a.online_at && b.online_at) {
        return b.online_at.getTime() - a.online_at.getTime();
      }
      return 0;
    }),
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    globalFilterFn: (row, columnIds, filterValue) => {
      const name = row.getValue("name") as string;
      const phone = row.getValue("phone") as string;
      const cid = String(row.getValue("cid"));
      const searchText = filterValue.toLowerCase();

      // search by cid only when start with #
      if (searchText.startsWith("#")) {
        const searchId = searchText.slice(1);
        return cid.includes(searchId);
      }

      // check for name or phone
      return (
        name?.toLowerCase().includes(searchText) || phone?.includes(searchText)
      );
    },
  });

  return (
    <div className="w-11/12 max-w-5xl mx-auto space-y-10">
      {/* later export orders to excel file */}
      <div className="flex flex-col" dir={isEn ? "ltr" : "rtl"}>
        <h3 className="text-xl">{isEn ? "owners" : "المستشارون"}</h3>
        <h6>{isEn ? "instant reservation" : "حجز فوري"}</h6>
      </div>
      <div className="rounded-md border w-[85vw] sm:w-full overflow-x-scroll">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        {/* selected */}
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        {/* current page count index */}
        <div className="cflex">
          <h5>
            {isEn ? (
              <>
                page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </>
            ) : (
              <>
                صفحة {table.getState().pagination.pageIndex + 1} من{" "}
                {table.getPageCount()}
              </>
            )}
          </h5>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {isEn ? "Previous" : "السابق"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {isEn ? "Next" : "التالي"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AllInstants;
