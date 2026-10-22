// packages
import { NextResponse } from "next/server";

// utils
import { setConsultantOffline, setConsultantOnline } from "@/data/online";
import { verifyInternalSecret } from "@/lib/auth/internal-secret";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";

// the realtime server's presence callback (presence-notifier): { consultantId, online }
export async function POST(request: Request) {
  // 401 for an unset secret, a missing or empty header, or another byte length
  if (!verifyInternalSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { consultantId, online } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof consultantId !== "string" ||
    consultantId.length === 0 ||
    typeof online !== "boolean"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    if (online) {
      await setConsultantOnline(consultantId);
    } else {
      await setConsultantOffline(consultantId);
    }
  } catch (err) {
    // no consultant with this user id (P2025: the update found no row)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
