// packages
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// utils
import { recordInstantSnapshot } from "@/data/instant";

export async function POST(request: Request) {
  const provided = request.headers.get("x-internal-secret");
  const expected = process.env.INTERNAL_SHARED_SECRET!;

  if (!provided || provided.length !== expected.length) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isValid = timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!isValid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { consultantsNow, clientsNow, role } = await request.json();

  await recordInstantSnapshot(consultantsNow, clientsNow, role);

  return NextResponse.json({ ok: true });
}
