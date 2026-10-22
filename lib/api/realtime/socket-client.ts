"use client";

// packages
import type { Socket } from "socket.io-client";

// "user" mints from the web session (USER / OWNER), "guest" needs no session
export type RealtimeTokenKind = "user" | "guest";

export const REALTIME_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

async function fetchRealtimeToken(kind: RealtimeTokenKind): Promise<string> {
  const res = await fetch(
    kind === "guest" ? "/api/realtime-token/guest" : "/api/realtime-token",
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`realtime token: ${res.status}`);

  const { token } = (await res.json()) as { token: string };
  return token;
}

// socket.io-client is loaded on demand, so it isn't part of the page's first-load javascript.
// the token lives 60s, so auth is a callback: every connect and reconnect attempt gets a fresh
// one (a reconnect with the first token is refused by the realtime server)
export async function createRealtimeSocket(
  kind: RealtimeTokenKind,
): Promise<Socket> {
  const { io } = await import("socket.io-client");

  return io(REALTIME_URL, {
    auth: (cb) => {
      fetchRealtimeToken(kind)
        .then((token) => cb({ token }))
        .catch(() => cb({}));
    },
  });
}

// the realtime server's public presence endpoints
export async function fetchOnlineIds(): Promise<string[]> {
  const res = await fetch(`${REALTIME_URL}/presence/online`, {
    cache: "no-store",
  });
  const { onlineIds } = (await res.json()) as { onlineIds: string[] };
  return onlineIds;
}

export type PresenceCounts = {
  owners: number;
  clients: number;
  guests: number;
  total: number;
};

export async function fetchPresenceCounts(): Promise<PresenceCounts> {
  const res = await fetch(`${REALTIME_URL}/presence/counts`, {
    cache: "no-store",
  });
  return (await res.json()) as PresenceCounts;
}
