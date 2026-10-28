"use client";

// packages
import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";

// "user" mints from the web session (USER / OWNER), "guest" needs no session
export type RealtimeTokenKind = "user" | "guest";

// a failed token request, with the route's http status (0: the request itself failed, or the
// answer had no token or address)
class RealtimeTokenError extends Error {
  constructor(readonly status: number) {
    super(`realtime token: ${status}`);
  }
}

// a token, and the realtime server's address: the token routes give both, so the address never
// comes from the browser build (no NEXT_PUBLIC_ variable) and never falls back to this site
async function fetchRealtimeAccess(
  kind: RealtimeTokenKind,
): Promise<{ token: string; url: string }> {
  const res = await fetch(
    kind === "guest" ? "/api/realtime-token/guest" : "/api/realtime-token",
    { cache: "no-store" },
  );
  if (!res.ok) throw new RealtimeTokenError(res.status);

  const { token, url } = (await res.json()) as { token?: string; url?: string };
  if (!token || !url) throw new RealtimeTokenError(0);
  return { token, url };
}

const tokenErrorStatus = (err: unknown) =>
  err instanceof RealtimeTokenError ? err.status : 0;

type RealtimeSocketOptions = Partial<ManagerOptions & SocketOptions> & {
  // called when a connect attempt couldn't get a token (401: no session)
  onTokenError?: (status: number) => void;
};

// socket.io-client is loaded on demand, so it isn't part of the page's first-load javascript.
// the address and a first token come first; a failure there throws (the caller's connect failed,
// with its own retries and error state). the token lives 60s, so auth is a callback: the first
// handshake uses that token, every reconnect gets a fresh one (an old token is refused)
export async function createRealtimeSocket(
  kind: RealtimeTokenKind,
  { onTokenError, ...options }: RealtimeSocketOptions = {},
): Promise<Socket> {
  let first: { token: string; url: string };
  try {
    first = await fetchRealtimeAccess(kind);
  } catch (err) {
    onTokenError?.(tokenErrorStatus(err));
    throw err;
  }

  const { io } = await import("socket.io-client");

  let unused: string | null = first.token;
  return io(first.url, {
    ...options,
    auth: (cb) => {
      if (unused) {
        const token = unused;
        unused = null;
        return cb({ token });
      }
      fetchRealtimeAccess(kind)
        .then(({ token }) => cb({ token }))
        .catch((err: unknown) => {
          onTokenError?.(tokenErrorStatus(err));
          cb({});
        });
    },
  });
}

// live connection counts by role; owner sockets get them (get-presence-counts, presence-changed)
export type PresenceCounts = {
  owners: number;
  clients: number;
  guests: number;
  total: number;
};
