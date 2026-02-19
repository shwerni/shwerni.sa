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
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import BulkOrderStatus from "@/app/_components/management/layout/bulk/order/orderStatus";

// utils
import { findPayment } from "@/utils";
import { dateToString } from "@/utils/moment";
import { exportOrders } from "@/utils/excel/orders";
import { encryptionDigitsToUrl, zencryption } from "@/utils/admin/encryption";

// prisma types
import { PaymentState } from  "@/lib/generated/prisma/enums";

// icons
import { GripHorizontal, ChevronDown, ChevronsUpDown } from "lucide-react";

// types
interface OrdersTable {
  oid: number;
  name: string;
  phone: string;
  created_at: Date;
  payment: {
    payment: PaymentState;
    total: number;
    tax: number;
  } | null;
  meeting:
  | {
    date: string;
  }[]
  | null;
  consultant: {
    name: string;
    phone: string;
  }
}

// return default
export function ALLOrders(props: { orders: OrdersTable[] | null }) {
  // orders
  const data: OrdersTable[] = props.orders ? props.orders : [];
  // orders
  const columns: ColumnDef<OrdersTable>[] = [
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
      accessorKey: "payment",
      header: "status",
      cell: ({ row }) => {
        const payment = row.original.payment;
        if (!payment) return <div className="text-muted">N/A</div>;

        return (
          <Badge
            className={`${findPayment(
              payment.payment
            )?.style} lowercase`}
          >
            {payment.payment}
          </Badge>
        );
      },
    },
    {
      accessorKey: "oid",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-fit px-0"
          >
            order{"'s"} id
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">#{row.getValue("oid")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "created_at",
      header: "date",
      cell: ({ row }) => <div>{dateToString(row.getValue("created_at"))}</div>,
    },
    {
      accessorKey: "total",
      header: "amount",
      cell: ({ row }) => {
        const payment = row.original.payment;
        if (!payment) return <div className="text-muted">N/A</div>;

        const amount =
          payment.total + payment.total * (Number(payment?.tax) / 100);

        // Format the amount as a dollar amount
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "SAR",
        }).format(amount);

        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        // single order
        const order = row.original;

        // id (crypted zid)
        const zid = zencryption(order.oid);


        // id (crypted zid)
        const czid = encryptionDigitsToUrl(order.oid);
        return (
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">open menu</span>
                  <GripHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-medium text-right">
                  {order.consultant.name}
                </DropdownMenuLabel>
                {/* separator */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>copy</DropdownMenuLabel>
                {/* copy order id */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(order.oid))
                  }
                >
                  order id
                </DropdownMenuItem>
                {/* copy order id */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(zid))
                  }
                >
                  order zid
                </DropdownMenuItem>
                {/* copy order id */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(czid))
                  }
                >
                  encrypted oid
                </DropdownMenuItem>
                {/* copy client phone */}
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(order.phone)}
                >
                  client phone
                </DropdownMenuItem>
                {/* separator */}
                <DropdownMenuSeparator />
                {/* acations */}
                <DropdownMenuLabel>actions</DropdownMenuLabel>
                {/* edit order */}
                <Link href={"/zadmin/orders/" + order.oid}>
                  <DropdownMenuItem>edit this order</DropdownMenuItem>
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
      const name = row.original.name ?? "";
      const phone = row.original.phone ?? "";
      const consultant = row.original.consultant?.name ?? "";
      const cid = String(row.original.oid);
      const searchText = filterValue.toLowerCase();

      // search by cid only when start with #
      if (searchText.startsWith("#")) {
        const searchId = searchText.slice(1);
        return cid.includes(searchId);
      }

      // check for name, phone, consultant
      return (
        name.toLowerCase().includes(searchText) ||
        phone.includes(searchText) ||
        consultant.toLowerCase().includes(searchText)
      );
    }
  });

  // get selected oid
  const getSelectedOids = () => {
    return table.getSelectedRowModel().rows.map((row) => row.original.oid);
  };

  // export orders as xlsx file
  function exportAsXlsx() {
    // export
    startLoading(() => {
      // export total dues
      exportOrders();
    });
  }
  return (
    <div className="w-11/12 mx-auto">
      {/* later export orders to excel file */}
      <div className="flex flex-row justify-between">
        <h3 className="text-xl">orders</h3>
        <Button
          className="zgreyBtn"
          onClick={() => exportAsXlsx()}
          disabled={onLoad}
        >
          <LoadingBtnEn loading={onLoad}>export as csv</LoadingBtnEn>
        </Button>
      </div>
      {/* bulk actions */}
      <BulkOrderStatus oids={getSelectedOids()} />
      <div className="flex flex-row justify-between items-center gap-5">
        <div className="flex items-center justify-between flex-1 py-4">
          <Input
            placeholder="Filter names or phones or oids..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                columns <ChevronDown className="ml-2 h-4 w-4" />
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
        <Link href="/zadmin/orders/new">
          <Button className="zgreyBtn">new order</Button>
        </Link>
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
