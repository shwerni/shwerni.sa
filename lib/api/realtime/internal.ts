import "server-only";

// lib
import { INTERNAL_SECRET_HEADER } from "@/lib/auth/internal-secret";

// the realtime server answers in milliseconds; a page never waits longer than this for it
const TIMEOUT_MS = 3_000;

// the realtime server's live list of online consultants (their user ids), from the guarded
// GET /internal/presence/online. server-side only: the secret never reaches a browser.
// throws when the server can't be reached, refuses, or answers something else
export async function getRealtimeOnlineIds(): Promise<string[]> {
  const res = await fetch(`${process.env.BACKEND_URL}/internal/presence/online`, {
    headers: {
      [INTERNAL_SECRET_HEADER]: process.env.INTERNAL_SHARED_SECRET ?? "",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`realtime presence: ${res.status}`);

  const { onlineIds } = (await res.json()) as { onlineIds?: unknown };
  if (!Array.isArray(onlineIds)) throw new Error("realtime presence: no onlineIds");

  return onlineIds.filter((id): id is string => typeof id === "string");
}
