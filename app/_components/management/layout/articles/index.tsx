"use client";
// React & Next
import React from "react";
import Link from "next/link";

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

// components
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import {  BlogState, UserRole } from "@/lib/generated/prisma/enums";

// types
import { Lang } from "@/types/types";

// constants
import { mainRoute } from "@/constants/links";

// icons
import { GripHorizontal, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Article } from "@/lib/generated/prisma/client";

interface Props {
  articles: Article[];
  lang?: Lang;
  role: UserRole;
}

const stateColor = (status: BlogState) => {
  if (status === BlogState.PUBLISHED) return "bg-green-200";
  if (status === BlogState.HIDDEN) return "bg-red-200";
  if (status === BlogState.HOLD) return "bg-amber-200";
};

export function ALLArticles({ articles, lang, role }: Props) {
  // lang
  const isEn = isEnglish(lang);

  const data = articles || [];

  const columns: ColumnDef<Article>[] = [
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
      accessorKey: "status",
      header: isEn ? "Status" : "الحالة",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "text-zblack-200 lowercase",
            stateColor(row.getValue("status")),
          )}
        >
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "aid",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-fit px-0"
        >
          {isEn ? "Article ID" : "رقم المقال"}
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="lowercase">#{row.getValue("aid")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: isEn ? "Title" : "العنوان",
      cell: ({ row }) => <div>{row.getValue("title")}</div>,
    },
    {
      accessorKey: "created_at",
      header: isEn ? "Created At" : "تاريخ الإنشاء",
      cell: ({ row }) => <div>{dateToString(row.getValue("created_at"))}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const blog = row.original;
        return (
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <GripHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{isEn ? "Copy" : "نسخ"}</DropdownMenuLabel>
                {blog.status === BlogState.PUBLISHED && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${mainRoute}articles/${blog.aid}`,
                      )
                    }
                  >
                    {isEn ? "Copy Article URL" : "نسخ رابط المقال"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  {isEn ? "Actions" : "إجراءات"}
                </DropdownMenuLabel>
                <Link href={`${findUser(role)?.url}articles/${blog.aid}`}>
                  <DropdownMenuItem>
                    {isEn ? "Edit Article" : "تعديل المقال"}
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </Dialog>
        );
      },
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    globalFilterFn: (row, columnIds, filterValue) => {
      const writer = row.getValue("writer") as string;
      const bid = String(row.getValue("bid"));
      const searchText = filterValue.toLowerCase();

      if (searchText.startsWith("#")) {
        const searchId = searchText.slice(1);
        return bid.includes(searchId);
      }

      return writer?.toLowerCase().includes(searchText);
    },
  });

  return (
    <div className="w-11/12 mx-auto">
      <div className="flex flex-row justify-between">
        <h3 className="text-xl">{isEn ? "Articles" : "المقالات"}</h3>
      </div>
      <div className="flex flex-row justify-between items-center gap-5">
        <div className="flex items-center justify-between flex-1 py-4">
          <Input
            placeholder={
              isEn
                ? "Filter writer or article id..."
                : "ابحث بالكاتب أو رقم المقال"
            }
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {isEn ? "Columns" : "الأعمدة"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link href={`${findUser(role)?.url}articles/new`}>
          <Button className="zgreyBtn">
            {isEn ? "New Article" : "مقال جديد"}
          </Button>
        </Link>
      </div>
      <div className="rounded-md border w-[85vw] sm:w-full overflow-x-scroll">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
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
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} {isEn ? "of" : "من"}{" "}
          {table.getFilteredRowModel().rows.length}{" "}
          {isEn ? "row(s) selected" : "صف (صفوف) محددة"}.
        </div>
        <div className="cflex">
          <h5>
            {isEn ? "Page" : "صفحة"} {table.getState().pagination.pageIndex + 1}{" "}
            {isEn ? "of" : "من"} {table.getPageCount()}
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
}
