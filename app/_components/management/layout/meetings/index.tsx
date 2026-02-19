"use client";
// React & Next
import React from "react";
import Link from "next/link";

// components
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// prisma data
import {
  getMeetingsForManagments,
  updateMeetingStateManual,
} from "@/data/admin/meeting";

// utils
import { isEnglish, meetingUrl, findUser } from "@/utils";
import { dateToDayAr, isMeetingStill, timeToArabic } from "@/utils/moment";

// types
import { Lang } from "@/types/types";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// icons
import { Check, GripHorizontal } from "lucide-react";
import PassedBtn from "./passedMeetings";
import { Meeting } from "@/lib/generated/prisma/client";

// types
type Meetings = {
  orders: {
    oid: number;
    name: string;
    phone: string;
    consultant: {
      name: string;
    };
  };
} & Meeting;

// props
interface Props {
  time: string;
  date: string;
  lang?: Lang;
  role: UserRole;
}

// translations
const t = (isEn: boolean) => ({
  meetings: isEn ? "Meetings" : "الاجتماعات",
  search: isEn ? "Search meetings..." : "ابحث عن الاجتماعات...",
  status: isEn ? "Status" : "الحالة",
  orderId: isEn ? "Order ID" : "رقم الطلب",
  consultant: isEn ? "Consultant" : "المستشار",
  client: isEn ? "client" : "العميل",
  date: isEn ? "Date" : "التاريخ",
  time: isEn ? "Time" : "الوقت",
  copy: isEn ? "Copy" : "نسخ",
  clientPhone: isEn ? "Client Phone" : "رقم العميل",
  actions: isEn ? "Actions" : "إجراءات",
  editMeeting: isEn ? "Edit meeting" : "تعديل الاجتماع",
  editOrder: isEn ? "Edit order" : "تعديل الطلب",
  loading: isEn ? "Loading..." : "جاري التحميل...",
  noResults: isEn ? "No results." : "لا يوجد نتائج.",
  done: isEn ? "done" : "تمت",
});

export function EmployeeMeetings({ time, date, lang, role }: Props) {
  // lang
  const isEn = isEnglish(lang);

  // labels
  const labels = t(isEn);

  // states
  // meetings data
  const [meetings, setMeetings] = React.useState<Meetings[]>([]);

  // pages
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // search
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  // loading
  const [loading, setLoading] = React.useState(false);

  // fetch meetings
  async function fetchMeetings() {
    setLoading(true);
    try {
      const data = await getMeetingsForManagments(page, debounced);
      if (data?.meetings && data?.totalCount) {
        setMeetings(data.meetings);
        setTotalPages(Math.ceil(data.totalCount / 10));
      } else {
        toast.error(
          isEn ? "Error while fetching meetings" : "خطأ أثناء جلب البيانات",
        );
      }
    } catch {
      toast.error(
        isEn ? "Error while fetching meetings" : "خطأ أثناء جلب البيانات",
      );
    } finally {
      setLoading(false);
    }
  }

  // toggle manual done state
  async function toggleDoneState(o: number, s: number) {
    try {
      // update
      updateMeetingStateManual(o, s);
      // toast
      toast.success(isEn ? "updated successfully" : "تم التحديث بنجاح", {
        duration: 500,
      });
    } catch {
      toast.error(
        isEn ? "Error while updating meeting" : "خطأ أثناء تحديث الاجتماع",
      );
    } finally {
      setLoading(false);
    }
  }

  // debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  React.useEffect(() => {
    fetchMeetings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, page]);

  // columns
  const columns: ColumnDef<Meetings>[] = [
    {
      accessorKey: "status",
      header: labels.status,
      cell: ({ row }) => {
        const m = row.original;
        const isStill = isMeetingStill(date, time, m.date, m.time);
        const badge =
          m.done || (m.url && m.consultantAttendance && m.clientAttendance) ? (
            <Badge className="bg-green-200 text-black font-medium lowercase">
              تم
            </Badge>
          ) : isStill ? (
            <Badge className="bg-amber-200 text-black font-medium lowercase">
              قادم
            </Badge>
          ) : (
            <Badge className="bg-pink-200 text-black font-medium lowercase">
              لم يتم
            </Badge>
          );
        return (
          <Dialog>
            <DialogTrigger>{badge}</DialogTrigger>
            <DialogContent className="w-11/12 max-w-96">
              <DialogDescription>
                <h3 className="text-center p-2">
                  {labels.meetings} - تفاصيل الحجز
                </h3>
              </DialogDescription>
              <div className="grid grid-rows-3 gap-2">
                <div className="flex justify-between">
                  <span>URL</span>
                  <span>{m.url ?? "لم يجهز بعد"}</span>
                </div>
                <div className="flex justify-between">
                  <span>حضور المستشار</span>
                  <span>
                    {m.consultantAttendance
                      ? `at ${m.consultantJoinedAt}`
                      : "لم يحضر"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>حضور العميل</span>
                  <span>
                    {m.clientAttendance ? `at ${m.clientJoinedAt}` : "لم يحضر"}
                  </span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      },
    },
    {
      accessorKey: "order",
      header: labels.orderId,
      cell: ({ row }) =>
        `#${row.original.orders.oid} - ${row.original.session}`,
    },
    {
      accessorKey: "consultant",
      header: labels.consultant,
      cell: ({ row }) => `#${row.original.orders.consultant.name}`,
    },
    {
      accessorKey: "order",
      header: labels.client,
      cell: ({ row }) => row.original.orders.name,
    },
    { accessorKey: "date", header: labels.date },
    {
      accessorKey: "time",
      header: labels.time,
      cell: ({ row }) => timeToArabic(row.original.time),
    },
    {
      id: "actions",
      header: labels.actions,
      cell: ({ row }) => {
        const m = row.original;
        const o = row.original.orders;
        return (
          <Dialog>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <GripHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{o.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{labels.copy}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(String(o.oid))}
                >
                  {labels.orderId}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(o.phone)}
                >
                  {labels.clientPhone}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `مستشار ${o.consultant} & ${o.name}`,
                    )
                  }
                >
                  اسم المستشار و العميل
                </DropdownMenuItem>
                {m.url && (
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(m.url!)}
                  >
                    رابط جوجل
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(
                      meetingUrl(o.oid, false, m.session),
                    )
                  }
                >
                  رابط الاجتماع (العميل)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(
                      meetingUrl(o.oid, true, m.session),
                    )
                  }
                >
                  رابط الاجتماع (المستشار)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{labels.actions}</DropdownMenuLabel>
                {/* update to done */}
                {(!m.url || !m.consultantAttendance || !m.clientAttendance) && (
                  <DropdownMenuItem
                    onClick={() => toggleDoneState(o.oid, m.session)}
                  >
                    {labels.done} {m.done && <Check className="w-2" />}
                  </DropdownMenuItem>
                )}
                <Link
                  href={`${findUser(role)?.url}meetings/${m.orderId}?session=${m.session}`}
                >
                  <DropdownMenuItem>{labels.editMeeting}</DropdownMenuItem>
                </Link>
                <Link href={`${findUser(role)?.url}orders/${m.orderId}`}>
                  <DropdownMenuItem>{labels.editOrder}</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </Dialog>
        );
      },
    },
  ];

  const table = useReactTable({
    data: meetings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const currDate = React.useRef<string>("");
  const meetingDaySeparator = (date: string) =>
    currDate.current !== date && (
      <TableRow key={`sep-${date}`}>
        <TableCell colSpan={columns.length}>
          <div className="w-fit mx-auto">
            {(() => {
              currDate.current = date;
              return <div>{date + " | " + dateToDayAr(date)}</div>;
            })()}
          </div>
        </TableCell>
      </TableRow>
    );

  return (
    <div className="w-11/12 mx-auto space-y-5" dir={isEn ? "ltr" : "rtl"}>
      <h3 className="text-xl">{labels.meetings}</h3>
      <div className="flex justify-between items-center gap-5 py-5">
        <Input
          placeholder={labels.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {role === UserRole.ADMIN && <PassedBtn />}
      </div>

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
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`sk-${i}-${j}`}>
                      <Skeleton className="h-4 w-full rounded bg-slate-300" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : meetings.length ? (
              table.getRowModel().rows.map((row, index) => (
                <React.Fragment key={index}>
                  {meetingDaySeparator(row.original.date)}
                  <TableRow>
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell key={index}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {labels.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center py-4">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          السابق
        </Button>
        <span>
          صفحة {page} من {totalPages}
        </span>
        <Button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          التالي
        </Button>
      </div>
    </div>
  );
}
