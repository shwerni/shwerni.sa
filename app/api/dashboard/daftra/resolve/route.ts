// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";

// lib
import { resolveReviewDocument } from "@/lib/daftra/resolve";
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

const actorSchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  role: z.nativeEnum(UserRole),
});

// "invoice:{oid}" or "refund:{refund.id}", the row's dedupeKey
const dedupeKeySchema = z
  .string()
  .regex(/^(invoice:[1-9]\d{0,9}|refund:[A-Za-z0-9_-]{1,64})$/);

const bodySchema = z.discriminatedUnion("outcome", [
  z.object({
    dedupeKey: dedupeKeySchema,
    outcome: z.literal("in_daftra"),
    daftraId: z.number().int().positive().max(2_147_483_647),
    daftraNo: z.string().trim().min(1).max(50).optional(),
    actor: actorSchema,
  }),
  z.object({
    dedupeKey: dedupeKeySchema,
    outcome: z.literal("not_in_daftra"),
    actor: actorSchema,
  }),
]);

// the dashboard settles a REVIEW invoice or refund receipt after a person checked daftra:
// in_daftra (with daftra's id, optionally its number) marks it SENT once daftra's own copy
// matches; not_in_daftra moves it back to FAILED so it can be sent again. nothing is created in
// daftra here. REVIEW rows only; anything else is not_review
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { actor, ...input } = parsed.data;
  try {
    const result = await resolveReviewDocument({ ...input, actorId: actor.id });
    console.info(
      `[daftra] dashboard resolve ${input.dedupeKey} ${input.outcome} by=${actor.id} → ${result.status}`,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      `[daftra] dashboard resolve ${input.dedupeKey} error`,
      err instanceof Error ? err.name : "error",
    );
    return NextResponse.json(
      { state: false, status: "failed", message: "حدث خطأ غير متوقع" },
      { status: 500 },
    );
  }
}
