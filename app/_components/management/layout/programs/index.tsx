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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// utils
import { isEnglish, findUser } from "@/utils";

// icons
import { GripHorizontal, ChevronsUpDown } from "lucide-react";

// types
import { Lang } from "@/types/types";
import { UserRole, ProgramState } from "@/lib/generated/prisma/enums";
import { Program } from "@/lib/generated/prisma/client";

interface Props {
  role: UserRole;
  lang?: Lang;
  programs: Program[];
}

const statusColor = (status: ProgramState) => {
  if (status === "PUBLISHED") return "bg-green-100";
  if (status === "HOLD") return "bg-amber-100";
  if (status === "HIDDEN") return "bg-red-100";
};

export function AllPrograms({ role, lang, programs }: Props) {
  const isEn = isEnglish(lang);
  const data = programs;

  const columns: ColumnDef<Program>[] = [
    {
      accessorKey: "prid",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-fit px-0"
        >
          {isEn ? "program id" : "رقم البرنامج"}
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>#{row.getValue("prid")}</div>,
    },
    {
      accessorKey: "title",
      header: isEn ? "program name" : "اسم البرنامج",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: isEn ? "status" : "الحالة",
      cell: ({ row }) => (
        <Badge className={`text-black ${statusColor(row.getValue("status"))}`}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const program = row.original;
        return (
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <GripHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {isEn ? "Actions" : "الإجراءات"}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(program.prid))
                  }
                >
                  {isEn ? "Copy program ID" : "نسخ الرقم التعريفي"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link href={`${findUser(role)?.url}/programs/${program.prid}`}>
                  <DropdownMenuItem>
                    {isEn ? "Edit this program" : "تعديل البرنامج"}
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

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  });

  return (
    <div className="w-11/12 mx-auto">
      <h3 className="text-xl mb-4">{isEn ? "Programs" : "البرامج"}</h3>
      <div className="flex flex-row justify-between items-center gap-5">
        <Input
          placeholder={
            isEn ? "Search by name or ID..." : "بحث بالاسم أو الرقم..."
          }
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button className="zgreyBtn">
          {isEn ? "New Program" : "برنامج جديد"}
        </Button>
      </div>
      <div className="rounded-md border mt-4 w-full overflow-x-auto">
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
                <TableRow key={row.id}>
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
                  {isEn ? "No results found." : "لا توجد نتائج"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center py-4">
        <div className="text-sm text-muted-foreground">
          {isEn ? "Page" : "صفحة"} {table.getState().pagination.pageIndex + 1}{" "}
          {isEn ? "of" : "من"} {table.getPageCount()}
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
