"use server";
// React & Next
import { NextResponse, type NextRequest } from "next/server";

// prisma db
import prisma from "@/lib/database/db";

// auth
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// utils
import { HttpError } from "@/lib/api/http-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ oid: string }> },
) {
  const user = await requireMobileUser(request);
  const { oid } = await params;

  const order = await prisma.order.findUnique({
    where: { oid: Number(oid) },
    select: { author: true, payment: { select: { payment: true } } },
  });

  // ownership check — never trust the oid alone, confirm it belongs to this user
  if (!order || order.author !== user.id) {
    throw new HttpError("not found", 404);
  }

  return NextResponse.json({ status: order.payment?.payment ?? null });
}