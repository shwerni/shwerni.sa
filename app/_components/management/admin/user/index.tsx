"use client";
// React & Next
import React from "react";
import Link from "next/link";

// icons
import { GripHorizontal, ChevronDown } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";
import { User } from "@/lib/generated/prisma/client";

// role badge color
function roleColor(role: UserRole) {
  if (role === UserRole.ADMIN) return "bg-zgrey-50";
  if (role === UserRole.OWNER) return "bg-zblue-200  bg-opacity-25";
  if (role === UserRole.USER) return "bg-green-200";
  if (role === UserRole.GROUP) return "bg-amber-200";
  if (role === UserRole.COORDINATOR) return "bg-pink-200";
  if (role === UserRole.MANAGER) return "bg-pink-200";
  if (role === UserRole.MARKETER) return "bg-pink-200";
  if (role === UserRole.SERVICE) return "bg-pink-200";
  if (role === UserRole.COLLABORATOR) return "bg-pink-200";
}

export default function AllUsers(props: {
  users: Partial<User>[] | undefined;
}) {
  // orders
  const data: Partial<User>[] = props.users ?? [];
  // orders
  const columns: ColumnDef<Partial<User>>[] = [
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
      header: "name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "phone",
      header: "phone",
      cell: ({ row }) => (
        <div className="font-meduim">{row.getValue("phone")}</div>
      ),
    },
    {
      accessorKey: "role",
      header: "role",
      cell: ({ row }) => (
        <Badge
          className={`mx-auto lowercase text-zblack-200 ${roleColor(
            row.getValue("role")
          )}`}
        >
          {row.getValue("role")}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        // single order
        const user = row.original;

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
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {/* copy order id */}
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(String(user.id))}
                >
                  Copy {"user'"} id
                </DropdownMenuItem>
                {/* copy client phone */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(user.phone))
                  }
                >
                  Copy {"user's"} phone
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* edit owner */}
                <Link href={"/zadmin/users/" + user.id}>
                  <DropdownMenuItem>Edit this user</DropdownMenuItem>
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
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
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
      const searchText = filterValue.toLowerCase();

      // check for name or phone
      return (
        name?.toLowerCase().includes(searchText) || phone?.includes(searchText)
      );
    },
  });

  return (
    <div className="w-11/12 mx-auto">
      {/* later export orders to excel file */}
      <div className="flex flex-row justify-between">
        <h3 className="text-xl">users</h3>
        <Button className="zgreyBtn">export as csv</Button>
      </div>
      <div className="flex flex-row justify-between items-center gap-5">
        <div className="flex items-center justify-between flex-1 py-4">
          <Input
            placeholder="Filter names or phones..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
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
        </div>
        <Button className="zgreyBtn">new user</Button>
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
            {" "}
            page {table.getState().pagination.pageIndex + 1} of{" "}
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
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
