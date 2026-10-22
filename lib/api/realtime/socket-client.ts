"use client";

// packages
import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";

// "user" mints from the web session (USER / OWNER), "guest" needs no session
export type RealtimeTokenKind = "user" | "guest";

export const REALTIME_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

// a failed token request, with the route's http status (0: the request itself failed)
class RealtimeTokenError extends Error {
  constructor(readonly status: number) {
    super(`realtime token: ${status}`);
  }
}

async function fetchRealtimeToken(kind: RealtimeTokenKind): Promise<string> {
  const res = await fetch(
    kind === "guest" ? "/api/realtime-token/guest" : "/api/realtime-token",
    { cache: "no-store" },
  );
  if (!res.ok) throw new RealtimeTokenError(res.status);

  const { token } = (await res.json()) as { token: string };
  return token;
}

type RealtimeSocketOptions = Partial<ManagerOptions & SocketOptions> & {
  // called when a connect attempt couldn't get a token (401: no session)
  onTokenError?: (status: number) => void;
};

// socket.io-client is loaded on demand, so it isn't part of the page's first-load javascript.
// the token lives 60s, so auth is a callback: every connect and reconnect attempt gets a fresh
// one (a reconnect with the first token is refused by the realtime server)
export async function createRealtimeSocket(
  kind: RealtimeTokenKind,
  { onTokenError, ...options }: RealtimeSocketOptions = {},
): Promise<Socket> {
  const { io } = await import("socket.io-client");

  return io(REALTIME_URL, {
    ...options,
    auth: (cb) => {
      fetchRealtimeToken(kind)
        .then((token) => cb({ token }))
        .catch((err: unknown) => {
          onTokenError?.(err instanceof RealtimeTokenError ? err.status : 0);
          cb({});
        });
    },
  });
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
