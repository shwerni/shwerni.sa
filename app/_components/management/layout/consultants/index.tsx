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
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import BulkOwnerStatus from "@/app/_components/management/layout/bulk/owner/ownerStatus";

// utils
import { isEnglish, findConsultantState, findUser } from "@/utils";
import { exportOwners } from "@/utils/excel/owners";

// prisma types
import {
  ConsultantState,
  UserRole,
} from "@/lib/generated/prisma/enums";
import { Consultant } from "@/lib/generated/prisma/client";

// types
import { Lang } from "@/types/types";

// icons
import { GripHorizontal, ChevronDown, ChevronsUpDown } from "lucide-react";

// props
interface Props {
  role: UserRole;
  lang?: Lang;
  owners: Consultant[] | undefined;
}

// enable badge color
const enabledColor = (status: boolean) => {
  // status badge background color
  if (status === true) return "bg-green-100";
  if (status === false) return "bg-red-100";
};

// published state badge color
const publishedColor = (status: ConsultantState) => {
  // status badge background color
  if (status === ConsultantState.PUBLISHED) return "bg-green-100";
  if (status === ConsultantState.HOLD) return "bg-amber-100";
  if (status === ConsultantState.HIDDEN) return "bg-red-100";
};

// return
export function ApprovedConsultants({ role, lang, owners }: Props) {
  // check language
  const isEn = isEnglish(lang);

  // orders
  const data: Consultant[] = owners ?? [];
  // orders
  const columns: ColumnDef<Consultant>[] = [
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
      accessorKey: "cid",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-fit px-0"
          >
            {isEn ? "owner's cid" : "رقم المستشار"}
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("cid")}</div>,
    },
    {
      accessorKey: "name",
      header: isEn ? "name" : "الاسم",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("name")}</div>
      ),
    },
    {
      // for searching
      accessorKey: "phone",
      header: "",
      cell: () => null,
      enableHiding: true,
    },
    {
      accessorKey: "statusA",
      header: isEn ? "status" : "الحالة",
      cell: ({ row }) => (
        <Badge
          className={`${publishedColor(
            row.getValue("statusA"),
          )} text-center text-zblack-100 lowercase`}
        >
          {isEn
            ? row.getValue("statusA")
            : findConsultantState(row.getValue("statusA"))?.label}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: isEn ? "visibility" : "الظهور",
      cell: ({ row }) => (
        <Badge
          className={`lowercase text-zblack-200 ${enabledColor(
            row.getValue("status"),
          )}`}
        >
          {Boolean(row.getValue("status"))
            ? isEn
              ? "enabled"
              : "مفعل"
            : isEn
              ? "disabled"
              : "معطل"}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        // single order
        const owner = row.original;

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
                    navigator.clipboard.writeText(String(owner.cid))
                  }
                >
                  {isEn ? "Copy owner' id" : "نسخ الرقم التعريفي"}
                </DropdownMenuItem>
                {/* copy client phone */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(owner.phone))
                  }
                >
                  {isEn ? "Copy owner's phone" : "نسخ رقم هاتف"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* edit owner */}
                <Link
                  href={`${findUser(role)?.url}consultants/${owner.cid}?approved`}
                >
                  <DropdownMenuItem>
                    {isEn ? "Edit this owner" : "تعديل ملف المستشار"}
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </Dialog>
        );
      },
    },
  ];

  // on load
  const [onLoad, startLoading] = React.useTransition();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ phone: false });
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

  // export orders as xlsx file
  function exportAsXlsx() {
    // export
    startLoading(() => {
      // export total dues
      exportOwners();
    });
  }

  // get selected cid
  const getSelectedCids = () => {
    return table.getSelectedRowModel().rows.map((row) => row.original.cid);
  };

  return (
    <div className="w-11/12 mx-auto">
      {/* later export orders to excel file */}
      <div className="flex flex-row justify-between">
        <h3 className="text-xl">{isEn ? "owners" : "المستشارون"}</h3>
        {role === UserRole.ADMIN && (
          <Button
            className="zgreyBtn"
            onClick={() => exportAsXlsx()}
            disabled={onLoad}
          >
            <LoadingBtnEn loading={onLoad}>export as csv</LoadingBtnEn>
          </Button>
        )}
      </div>
      {/* bulk eidt */}
      {role === UserRole.ADMIN && <BulkOwnerStatus cids={getSelectedCids()} />}
      <div className="flex flex-row justify-between items-center gap-5">
        <div className="flex items-center justify-between flex-1 py-4">
          <Input
            placeholder="Filter names or phones or cids..."
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
          <Button className="zgreyBtn">new owner</Button>
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
