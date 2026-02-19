"use client";
// React & Next
import React from "react";
import Link from "next/link";

// pacakges
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
import { toast } from "@/components/ui/use-toast";

// prisma data
import { updateAllAverageRates } from "@/data/admin/review";

// types
import { Lang } from "@/types/types";

// utils
import { isEnglish, findReview, findUser } from "@/utils";
import { dateToString } from "@/utils/moment";

// prisma types
import { ReviewState, UserRole } from "@/lib/generated/prisma/enums";

// types
import { ConsultantReview } from "@/types/admin";

// icons
import { GripHorizontal, ChevronDown, ChevronsUpDown } from "lucide-react";

// props
interface Props {
  role: UserRole;
  lang?: Lang;
  reviews: ConsultantReview[];
}

// payment badge color
const paymentColor = (status: ReviewState) => {
  // payment status badge ackground color
  if (status === ReviewState.PUBLISHED) return "bg-green-200";
  if (status === ReviewState.HIDDEN) return "bg-red-200";
  if (status === ReviewState.HOLD) return "bg-amber-200";
};

// reviews
export function ALLReviews({ role, lang, reviews }: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // reviews
  const data: ConsultantReview[] = reviews ? reviews : [];

  // reviews
  const columns: ColumnDef<ConsultantReview>[] = [
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
      header: isEn ? "status" : "الحالة",
      cell: ({ row }) => (
        <Badge
          className={`${paymentColor(
            row.getValue("status"),
          )} text-zblack-200 lowercase`}
        >
          {isEn
            ? row.getValue("status")
            : findReview(row.getValue("status"))?.label}
        </Badge>
      ),
    },
    {
      accessorKey: "consultant",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-fit px-0"
          >
            {isEn ? "owner" : "المستشار"}
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const consultant = row.getValue("consultant") as { name: string };
        return <div className="lowercase">#{consultant.name}</div>;
      },
    },
    {
      accessorKey: "name",
      header: isEn ? "name" : "العميل",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      // for searching
      accessorKey: "cid",
      header: "",
      cell: () => null,
      enableHiding: true,
    },
    {
      accessorKey: "created_at",
      header: "date",
      cell: ({ row }) => <div>{dateToString(row.getValue("created_at"))}</div>,
    },
    {
      accessorKey: "comment",
      header: isEn ? "comment" : "التعليق",
      cell: ({ row }) => {
        return (
          <h6 className="max-h-14 overflow-hidden font-medium">
            {row.getValue("comment")}
          </h6>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        // single order
        const review = row.original;

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
                <DropdownMenuLabel>
                  {isEn ? "Actions" : "الإجراءات"}
                </DropdownMenuLabel>
                {/* copy order id */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(review.consultantId))
                  }
                >
                  {isEn ? "copy owner's cid" : "نسخ رقم المستشار التعريفي"}
                </DropdownMenuItem>
                {/* copy client name */}
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(review.name)}
                >
                  {isEn ? "copy reviewer name" : "نسخ اسم العميل"}
                </DropdownMenuItem>
                {/* copy client comment */}
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(review.comment)}
                >
                  {isEn ? "copy reviewer comment" : "نسخ التعليق"}{" "}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* edit dialog content */}
                <Link href={`${findUser(role)?.url}reviews/${review.id}`}>
                  <DropdownMenuItem>
                    {isEn ? "edit this review" : "تعديل هذا التقييم"}
                  </DropdownMenuItem>
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
    [],
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ cid: false });
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
      const consultant = row.getValue("owner") as string;
      const cid = String(row.getValue("cid"));
      const searchText = filterValue.toLowerCase();

      // search by cid only when start with #
      if (searchText.startsWith("#")) {
        const searchId = searchText.slice(1);
        return cid.includes(searchId);
      }

      // check for name or phone
      return (
        name?.toLowerCase().includes(searchText) ||
        consultant?.includes(searchText)
      );
    },
  });

  // update all ratings
  async function updateAll() {
    await updateAllAverageRates().then((response) => {
      if (response) {
        toast({
          title: "all review has been successfully updated",
          duration: 1700,
        });
      } else {
        toast({
          title: "error has occurred",
          duration: 1700,
        });
      }
    });
  }

  return (
    <div className="w-11/12 mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-xl">{isEn ? "reviews" : "التقييمات"}</h3>
        {role === UserRole.ADMIN && (
          <Button className="zgreyBtn" onClick={() => updateAll()}>
            recalculate reviews
          </Button>
        )}
      </div>
      <div className="flex flex-row justify-between items-center gap-5">
        <div className="flex items-center justify-between flex-1 py-4">
          <Input
            placeholder="Filter names or owners..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          {role === UserRole.ADMIN && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
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
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {role === UserRole.ADMIN && (
          <Button className="zgreyBtn">new review</Button>
        )}
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
                            header.getContext(),
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
}
