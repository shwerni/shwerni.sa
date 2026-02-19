"use client";

// React & Next
import React from "react";
import Link from "next/link";

// packages
import moment from "moment";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

// utils
import { findUser } from "@/utils";
import { dateToDayAr, isMeetingStill, timeToArabic } from "@/utils/moment";

// icons
import { GripHorizontal } from "lucide-react";
import { UserRole } from "@/lib/generated/prisma/enums";
import { FreeSession } from "@/lib/generated/prisma/client";

// types
type Session = (FreeSession & { consultant: { name: string } })

// props
interface Props {
  time: string;
  date: string;
  role: UserRole;
  sessions: Session[] | null;
}

export default function AllFreeSessions({ time, date, sessions, role }: Props) {
  const data: Session[] = sessions ?? [];
  const currDate = React.useRef<string>("");

  const sessionStatus = (
    url: string,
    clientAttend: boolean | null,
    ownerAttend: boolean | null,
    sDate: string,
    sTime: string
  ) => {
    const isStill = isMeetingStill(date, time, sDate, sTime);
    if (url && ownerAttend && clientAttend)
      return <Badge className="bg-green-200 text-zblack">تم</Badge>;
    if (isStill)
      return <Badge className="bg-amber-200 text-zblack text-[10px] sm:text-xs">قادم</Badge>;
    return <Badge className="bg-pink-200 text-zblack">لم يتم</Badge>;
  };

  const sessionDaySeparator = (date: string) => (
    currDate.current !== date && (
      <TableRow>
        <TableCell colSpan={7}>
          <div className="w-fit mx-auto">
            {currDate.current !== date && (() => {
              currDate.current = date;
              return <div>{date + " | " + dateToDayAr(date)}</div>;
            })()}
          </div>
        </TableCell>
      </TableRow>
    )
  );

  function sortTime(array: Row<Session>[]) {
    return array.sort((a, b) => {
      const aD = moment(a.original.date);
      const bD = moment(b.original.date);
      const dateDiff = bD.diff(aD);
      if (dateDiff !== 0) return dateDiff;
      const aT = moment(a.original.time, "HH:mm");
      const bT = moment(b.original.time, "HH:mm");
      return bT.diff(aT);
    });
  }

  const columns: ColumnDef<Session>[] = [
    {
      accessorKey: "url",
      header: "الحالة",
      cell: ({ row }) => (
        <Dialog>
          <DialogTrigger>
            {sessionStatus(
              row.getValue("url"),
              row.original.clientAttend,
              row.original.ownerAttend,
              row.original.date,
              row.original.time
            )}
          </DialogTrigger>
          <DialogContent className="w-11/12 max-w-96">
            <DialogDescription>
              <h3 className="text-center p-2">تفاصيل الجلسة</h3>
            </DialogDescription>
            <div className="grid grid-rows-3">
              <div className="flex justify-between"><span>العميل</span><span>{row.original.name}</span></div>
              <div className="flex justify-between"><span>المستشار</span><span>{row.original.consultant.name}</span></div>
              <div className="flex justify-between"><span>رابط</span><span>{row.original.url ?? "لم يجهز بعد"}</span></div>
              <div className="flex justify-between"><span>حضور المستشار</span><span>{row.original.ownerAttend ? `عند ${row.original.ownerATime}` : "لم يحضر"}</span></div>
              <div className="flex justify-between"><span>حضور العميل</span><span>{row.original.clientAttend ? `عند ${row.original.clientATime}` : "لم يحضر"}</span></div>
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      accessorKey: "fid",
      header: "رقم الجلسة",
      cell: ({ row }) => <div className="lowercase">#{row.getValue("fid")}</div>,
    },
    {
      accessorKey: "consultant",
      header: "المستشار",
      cell: ({ row }) => <div>{row.getValue("consultant")}</div>,
    },
    {
      accessorKey: "date",
      header: "التاريخ",
      cell: ({ row }) => <div>{row.getValue("date")}</div>,
    },
    {
      accessorKey: "time",
      header: "الوقت",
      cell: ({ row }) => <div>{timeToArabic(row.getValue("time"))}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const session = row.original;
        return (
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <GripHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{session.name}</DropdownMenuLabel>
              <DropdownMenuLabel>نسخ</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(session.fid))}>رقم الجلسة</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(session.phone))}>رقم العميل</DropdownMenuItem>
              {session.url && <DropdownMenuItem onClick={() => { if (session.url) navigator.clipboard.writeText(session.url) }}>رابط مباشر</DropdownMenuItem>}
              <DropdownMenuSeparator />
              {/* edit meeting */}
              <Link href={`${findUser(role)?.url}freesessions/${session.fid}`}>
                <DropdownMenuItem>تعديل الجلسة</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
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
  });

  return (
    <div className="w-11/12 mx-auto space-y-5">
      <div className="flex justify-between items-center gap-5 w-full py-5" dir="rtl">
        <h3 className="text-xl">الجلسات المجانية</h3>
        <Input
          placeholder="بحث..."
          value={(table.getColumn("consultant")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("consultant")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border w-[85vw] sm:w-full overflow-x-scroll">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              sortTime(table.getRowModel().rows).map((row) => (
                <React.Fragment key={row.id}>
                  {sessionDaySeparator(row.getValue("date"))}
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} صف
        </div>
        <div><h5>صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}</h5></div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>السابق</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>التالي</Button>
        </div>
      </div>
    </div>
  );
}
