"use client";

// React
import { useCallback, useEffect, useRef, useState } from "react";

// packages
import type { Socket } from "socket.io-client";

// utils
import {
  createRealtimeSocket,
  PresenceCounts,
} from "@/lib/api/realtime/socket-client";

type PresenceChanged = {
  consultantId: string;
  online: boolean;
  onlineCount: number;
  counts: PresenceCounts;
};

// the realtime server's answer to consultant-online
type OnlineAck = { online: boolean; busyUntil?: number };

// the realtime server's answer to get-presence-counts (null for a socket that isn't an owner)
type CountsAck = { counts: PresenceCounts | null };

// why the page stopped trying: the server can't be reached, or there's no web session
export type PresenceFailure = "unreachable" | "session";

const ACK_TIMEOUT_MS = 5_000;

// failed attempts in a row before the page shows an error: 2s, 4s, 8s, 16s, 30s apart
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2_000;
const RETRY_MAX_MS = 30_000;

// connection events don't broadcast counts, so the clients count is refreshed while online
const COUNTS_REFRESH_MS = 30_000;

export function useConsultantPresence({ userId }: { userId: string }) {
  // stops the current run (goOffline); each run sets its own
  const stopRef = useRef<(() => void) | null>(null);
  // connected = the realtime server acked this socket as online
  const [connected, setConnected] = useState(false);
  const [failure, setFailure] = useState<PresenceFailure | null>(null);
  // bumped by retry() to start a fresh run
  const [run, setRun] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [counts, setCounts] = useState<PresenceCounts>({
    owners: 0,
    clients: 0,
    guests: 0,
    total: 0,
  });

  useEffect(() => {
    if (!userId) return;

    // per run: a strict-mode double mount or a retry never shares state with an older run
    let cancelled = false;
    let socket: Socket | null = null;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const countsTimer = setInterval(() => {
      if (socket?.connected) void refreshCounts();
    }, COUNTS_REFRESH_MS);

    // ends this run: offline on the server, no more emits, retries or state updates
    function stop() {
      if (cancelled) return;
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      clearInterval(countsTimer);
      socket?.emit("consultant-offline");
      socket?.disconnect();
      socket = null;
    }
    stopRef.current = stop;

    function fail(reason: PresenceFailure) {
      if (cancelled) return;
      stop();
      setConnected(false);
      setFailure(reason);
    }

    // one more failed attempt, retried with backoff; past the cap the run ends with an error
    function retryLater(action: () => void) {
      failures += 1;
      if (failures > MAX_RETRIES) return fail("unreachable");

      const delay = Math.min(RETRY_BASE_MS * 2 ** (failures - 1), RETRY_MAX_MS);
      // one pending retry at a time: the newest failure decides what runs next
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (!cancelled) action();
      }, delay);
    }

    // over this socket (owners only on the server), never browser http to the realtime server
    async function refreshCounts() {
      const s = socket;
      if (!s?.connected) return;
      try {
        const ack = (await s
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck("get-presence-counts")) as CountsAck;
        if (!cancelled && ack?.counts) setCounts(ack.counts);
      } catch (err) {
        console.error("[presence] failed to get counts:", err);
      }
    }

    // this socket's own ack decides; asking again is safe, the server counts a socket once
    async function goOnline(s: Socket) {
      let ack: OnlineAck | null = null;
      try {
        ack = (await s
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck("consultant-online")) as OnlineAck;
      } catch {
        // no ack in time
      }
      if (cancelled || socket !== s || !s.connected) return;

      if (ack?.online) {
        failures = 0;
        setConnected(true);
        void refreshCounts();
        return;
      }

      // refused until busyUntil (a paid instant session): the page reacts in step 3d
      if (ack?.busyUntil) return;

      // no ack, or the emit beat the server's token check
      retryLater(() => void goOnline(s));
    }

    async function connect() {
      let s: Socket;
      try {
        s = await createRealtimeSocket("user", {
          // every retry goes through retryLater, so one cap covers them all
          reconnection: false,
          // no web session: retrying can't help
          onTokenError: (status) => {
            if (status === 401) fail("session");
          },
        });
      } catch (err) {
        console.error("[presence] failed to load the socket client:", err);
        return retryLater(() => void connect());
      }

      // ended while loading
      if (cancelled) {
        s.disconnect();
        return;
      }
      socket = s;

      // every connect is a new socket on the server, so it announces itself again
      s.on("connect", () => {
        if (!cancelled) void goOnline(s);
      });

      // the connection never opened (network, cors, server down)
      s.on("connect_error", (err) => {
        if (cancelled) return;
        console.error("[presence] connect_error:", err.message);
        retryLater(() => s.connect());
      });

      // a drop, or a server-side disconnect (refused token, rate limit)
      s.on("disconnect", () => {
        if (cancelled) return;
        setConnected(false);
        retryLater(() => s.connect());
      });

      s.on("presence-changed", (payload: PresenceChanged) => {
        if (cancelled) return;
        setOnlineCount(payload.onlineCount);
        setCounts(payload.counts);
      });
    }

    void connect();

    return stop;
  }, [userId, run]);

  // explicit offline on the realtime server (revalidation timeout). the page keeps its current
  // state until the caller navigates away, so nothing flashes before the redirect
  const goOffline = useCallback(() => {
    stopRef.current?.();
  }, []);

  // starts over after a failure
  const retry = useCallback(() => {
    setFailure(null);
    setRun((n) => n + 1);
  }, []);

  return { connected, onlineCount, counts, failure, goOffline, retry };
}
