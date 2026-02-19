"use client";
// React & Next
import React from "react";
import Link from "next/link";

// pacakges
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

// components
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

// utils
import { cn } from "@/lib/utils";
import { isEnglish, findUser } from "@/utils";
import { dateToString } from "@/utils/moment";

// prisma types
import {  UserRole } from "@/lib/generated/prisma/enums";

// icons
import { GripHorizontal, ChevronsUpDown } from "lucide-react";
import { Lang } from "@/types/types";
import { PreConsultation } from "@/lib/generated/prisma/client";

// props
interface Props {
  role: UserRole;
  sessions: PreConsultation[] | null;
  lang?: Lang;
}

// return default
export function EmployeePreConsultion({ role, lang, sessions }: Props) {
  // check language
  const isEn = isEnglish(lang);

  // orders
  const data: PreConsultation[] = sessions ? sessions : [];
  // orders
  const columns: ColumnDef<PreConsultation>[] = [
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
      accessorKey: "response",
      header: "الرد",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "text-zblack-200 lowercase",
            row.getValue("response") ? "bg-green-200" : "bg-red-200"
          )}
        >
          {row.getValue("response")
            ? isEn
              ? "answered"
              : "تم الرد"
            : isEn
            ? "yet"
            : "لم يتم"}
        </Badge>
      ),
    },
    {
      accessorKey: "pid",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-fit px-0"
          >
            رقم الجلسة
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">#{row.getValue("pid")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "العميل",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      // for searching
      accessorKey: "phone",
      header: "",
      cell: () => null,
      enableHiding: true,
    },
    {
      // for searching
      accessorKey: "issue",
      header: "السؤال",
      cell: ({ row }) => {
        return (
          <h6 className="max-h-14 overflow-hidden font-medium">
            {row.getValue("issue")}
          </h6>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "التاريخ",
      cell: ({ row }) => <div>{dateToString(row.getValue("created_at"))}</div>,
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<PreConsultation> }) => {
        // single order
        const session = row.original;

        return (
          <Dialog>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">القائمة</span>
                  <GripHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>نسخ</DropdownMenuLabel>
                {/* copy order id */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(session.pid))
                  }
                >
                  رقم الجلسة
                </DropdownMenuItem>
                {/* copy client phone */}
                {role === UserRole.ADMIN && (
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(session.phone)}
                  >
                    رقم الهاتف
                  </DropdownMenuItem>
                )}
                {/* separator */}
                <DropdownMenuSeparator />
                {/* acations */}
                <DropdownMenuLabel>الاجراءات</DropdownMenuLabel>
                {/* edit order */}
                <Link
                  href={`${findUser(role)?.url}preconsultation/${session.pid}`}
                >
                  <DropdownMenuItem>تعديل هذه الجلسة</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </Dialog>
        );
      },
    },
  ];

  // table data sorting states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ phone: false, consultant: false });
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
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
      const consultant = row.getValue("consultant") as string;
      const cid = String(row.getValue("oid"));
      const searchText = filterValue.toLowerCase();

      // search by cid only when start with #
      if (searchText.startsWith("#")) {
        const searchId = searchText.slice(1);
        return cid.includes(searchId);
      }

      // check for name or phone
      return (
        name?.toLowerCase().includes(searchText) ||
        phone?.includes(searchText) ||
        consultant?.includes(searchText)
      );
    },
  });

  return (
    <div className="w-11/12 mx-auto space-y-5">
      {/* orders */}
      <div dir="rtl">
        <h3 className="text-xl">الجلسات</h3>
        {/* search bar */}
        <div className="flex flex-row justify-between items-center gap-5">
          <Input
            placeholder="البحث..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>
      {/* table content */}
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
          {table.getFilteredRowModel().rows.length} صفوف محدد{" "}
          {table.getFilteredSelectedRowModel().rows.length} من
        </div>
        {/* current page count index */}
        <div className="cflex">
          <h5>
            صفحة {table.getState().pagination.pageIndex + 1} من{" "}
            {table.getPageCount()}
          </h5>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
