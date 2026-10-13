// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";

// handlers
import { markOrderPaidByDashboard } from "@/handlers/admin/order/mark-paid";

// lib
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

const bodySchema = z.object({
  oid: z.number().int().positive().max(2_147_483_647),
  method: z.enum(["transaction", "visaMoyasar", "tabby"]),
  reference: z.string().trim().max(200).optional(),
  notifications: z.boolean().default(true),
  daftra: z.boolean().default(true),
  actor: z.object({
    id: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(200),
    role: z.nativeEnum(UserRole),
  }),
});

// the dashboard marks an order as paid. the amount is never an input (Payment.total is the
// price); the handler checks the state and runs the webhooks' PAID path. generic messages here,
// the details stay in the logs
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const result = await markOrderPaidByDashboard(parsed.data);
  return NextResponse.json(result);
}
