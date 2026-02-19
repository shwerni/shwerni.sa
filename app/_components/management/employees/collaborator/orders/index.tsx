"use client";
// React & Next
import React from "react";

// packages
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";

// components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

// prisma data
import { getOrdersForCollaboration } from "@/data/admin/collaboration";

// types
import { Lang } from "@/types/types";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// utils
import { dateToString } from "@/utils/moment";
import { isEnglish, findPayment } from "@/utils";

// icons
import { GripHorizontal } from "lucide-react";

// types
interface OrdersTable {
  oid: number;
  name: string;
  phone: string;
  created_at: Date;
  consultant: { name: string; phone: string };
  meeting: { session: number }[];
  payment: { payment: PaymentState; total: number } | null;
}

// props
interface Props {
  lang?: Lang;
  collaboratorId: string;
}

// translations
const t = (isEn: boolean) => ({
  orders: isEn ? "Orders" : "الطلبات",
  search: isEn ? "Search orders..." : "ابحث عن الطلبات...",
  loading: isEn ? "Loading..." : "جاري التحميل...",
  noResults: isEn ? "No results." : "لا توجد نتائج.",
  previous: isEn ? "Previous" : "السابق",
  next: isEn ? "Next" : "التالي",
  page: isEn ? "Page" : "صفحة",
  of: isEn ? "of" : "من",
  status: isEn ? "Status" : "الحالة",
  orderId: isEn ? "Order ID" : "رقم الطلب",
  name: isEn ? "Name" : "الاسم",
  phone: isEn ? "Phone" : "الهاتف",
  consultant: isEn ? "Consultant" : "المستشار",
  date: isEn ? "Date" : "التاريخ",
  total: isEn ? "Total" : "الأجمالي",
  copy: isEn ? "Copy" : "نسخ",
  copyOid: isEn ? "Order ID" : "رقم الطلب",
  copyZid: isEn ? "Order Zid" : "معرّف مشفر",
  copyEnc: isEn ? "Encrypted OID" : "المعرف المشفر",
  copyPhone: isEn ? "Client Phone" : "هاتف العميل",
  actions: isEn ? "Actions" : "الإجراءات",
  editOrder: isEn ? "Edit this order" : "تعديل هذا الطلب",
  editMeetings: isEn ? "Edit meetings" : "تعديل الاجتماعات",
  menu: isEn ? "Menu" : "القائمة",
});

export default function CollaborationOrders({ collaboratorId, lang }: Props) {
  // lang
  const isEn = isEnglish(lang);

  // labels
  const labels = t(isEn);

  // data
  const [data, setData] = React.useState<OrdersTable[]>([]);

  // pagmention states
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(0);

  // search
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  // loading
  const [loading, setLoading] = React.useState(true);

  // get data
  async function getOrders() {
    setLoading(true);
    try {
      // get orders
      const data = await getOrdersForCollaboration(
        collaboratorId,
        page,
        debounced,
      );

      // update states
      setData(data.orders);
      setTotalPages(data.totalPages);
    } catch {
      // toast
      toast.error(
        isEn ? "Error while fetching data" : "حدث خطأ أثناء جلب البيانات",
      );
    } finally {
      setLoading(false);
    }
  }

  // on search change
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(search);
    }, 500); // wait 500ms after typing stops

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // on page or search change
  React.useEffect(() => {
    getOrders();
  }, [page, debounced]);

  // columns
  const columns: ColumnDef<OrdersTable>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: "payment",
      header: labels.status,
      cell: ({ row }) =>
        row.original.payment ? (
          <Badge className={findPayment(row.original.payment.payment)?.style}>
            {isEn
              ? row.original.payment.payment.toLowerCase()
              : findPayment(row.original.payment.payment)?.label}
          </Badge>
        ) : (
          <div className="text-muted">N/A</div>
        ),
    },
    {
      accessorKey: "oid",
      header: labels.orderId,
      cell: ({ row }) => <span>#{row.original.oid}</span>,
    },
    { accessorKey: "name", header: labels.name },
    {
      accessorKey: "consultant",
      header: labels.consultant,
      cell: ({ row }) => row.original.consultant?.name,
    },
    {
      accessorKey: "payment",
      header: labels.total,
      cell: ({ row }) => row.original.payment?.total + " sar",
    },
    {
      accessorKey: "created_at",
      header: labels.date,
      cell: ({ row }) => dateToString(row.original.created_at),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        // single order
        const order = row.original;

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
                <DropdownMenuLabel>{labels.copy}</DropdownMenuLabel>
                {/* copy order id */}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(order.oid))
                  }
                >
                  {labels.copyOid}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Dialog>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4 w-11/12 mx-auto">
      <h3>{labels.orders}</h3>

      <Input
        placeholder="Search orders..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="rounded-md border w-[85vw] sm:w-full overflow-x-scroll">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header, index) => (
                  <TableHead key={index}>
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
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="h-4 w-full rounded bg-slate-300" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell key={index}>
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
                <TableCell colSpan={columns.length} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          {labels.previous}
        </Button>
        <span>
          {labels.page} {page} {labels.of} {totalPages}
        </span>
        <Button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          {labels.next}
        </Button>
      </div>
    </div>
  );
}
