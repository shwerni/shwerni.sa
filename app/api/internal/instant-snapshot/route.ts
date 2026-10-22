// packages
import { NextResponse } from "next/server";

// utils
import { recordInstantSnapshot } from "@/data/instant";
import { verifyInternalSecret } from "@/lib/auth/internal-secret";

const ROLES = ["OWNER", "USER", "GUEST"] as const;
type SnapshotRole = (typeof ROLES)[number];

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

// the realtime server's daily stats call (instant-snapshot-notifier):
// { consultantsNow, clientsNow, role }
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

  const { consultantsNow, clientsNow, role } = (body ?? {}) as Record<
    string,
    unknown
  >;
  if (
    !isCount(consultantsNow) ||
    !isCount(clientsNow) ||
    !ROLES.includes(role as SnapshotRole)
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await recordInstantSnapshot(consultantsNow, clientsNow, role as SnapshotRole);

  return NextResponse.json({ ok: true });
}
