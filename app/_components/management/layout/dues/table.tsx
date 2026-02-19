"use client";
// React & Next
import React from "react";
import Link from "next/link";

// components
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// prisma types
import { UserRole, CouponType } from "@/lib/generated/prisma/enums";

// utils
import { findUser } from "@/utils";
import { dateToString } from "@/utils/moment";
import { calculateDues } from "@/utils/admin/dues";

// types
interface Dues {
  oid: number;
  consultantId: number;
  due_at: Date | null;
  meeting:
    | {
        url: string | null;
        consultantAttendance: boolean | null;
        clientAttendance: boolean | null;
      }[]
    | null;
  payment: {
    total: number;
    commission: number;
    tax: number;
    coupon?: {
      discount: number;
      type: CouponType;
    };
  } | null;
  consultant: {
    name: string;
  };
}

interface Props {
  dues: Dues[];
  role: UserRole;
  isEn: boolean;
}

export default function DuesTable({ dues, role, isEn }: Props) {
  const totalConsultant = dues.reduce((a, c) => {
    if (!c.payment) return a;
    const { consultantEarning } = calculateDues(c.payment);
    return a + consultantEarning;
  }, 0);

  const totalAmount = dues.reduce((a, c) => {
    if (!c.payment) return a;
    return a + c.payment.total;
  }, 0);

  return (
    <div>
      <ScrollArea className="[&>div>div[style]]:block! mt-0! mb-0! w-[85vw] sm:w-full h-[55vh] rounded-md">
        <Table>
          <TableBody>
            {dues.map((i) => {
              const payment = i.payment;
              const meeting = i.meeting?.[0];
              const duesData = payment ? calculateDues(payment) : null;

              return (
                <TableRow key={i.oid}>
                  <TableCell className="font-medium">#{i.oid}</TableCell>
                  <TableCell>
                    <span
                      className={`${
                        meeting?.url &&
                        meeting?.clientAttendance &&
                        meeting?.consultantAttendance
                          ? "bg-green-200"
                          : "bg-red-200"
                      } w-fit h-fit rounded-2xl px-2`}
                    >
                      {meeting?.url &&
                      meeting?.clientAttendance &&
                      meeting?.consultantAttendance
                        ? isEn
                          ? "success"
                          : "تمت"
                        : isEn
                          ? "incomplete"
                          : "لم تتم"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`${findUser(role)?.url}dues/` + i.consultantId}>
                      {i.consultant.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {i.due_at ? dateToString(i.due_at) : "date not found"}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment?.total.toFixed(2)} {isEn ? "sar" : "ريال"}
                  </TableCell>
                  <TableCell className="text-right">
                    {duesData?.consultantEarning.toFixed(2)}{" "}
                    {isEn ? "sar" : "ريال"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Table Footer */}
      <Table className="overflow-hidden mt-0!">
        <TableCaption>
          {isEn ? "A list of dues." : "قائمة المستحقات"}
        </TableCaption>
        <TableFooter className="bg-transparent!">
          <TableRow>
            <TableCell className="w-1/2">
              {isEn ? "Total" : "الاجمالي"}
            </TableCell>
            <TableCell className="text-right">
              {dues.length} {isEn ? "orders" : "الطلبات"}
            </TableCell>
            <TableCell className="text-right">
              {totalAmount.toFixed(2)} {isEn ? "sar" : "ريال"}
            </TableCell>
            <TableCell className="text-right">
              {totalConsultant.toFixed(2)} {isEn ? "sar" : "ريال"}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
