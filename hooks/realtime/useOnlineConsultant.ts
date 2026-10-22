"use client";

// React
import { useCallback, useEffect, useRef, useState } from "react";

// packages
import type { Socket } from "socket.io-client";

// utils
import {
  createRealtimeSocket,
  fetchOnlineIds,
  fetchPresenceCounts,
  PresenceCounts,
} from "@/lib/api/realtime/socket-client";

type PresenceChanged = {
  consultantId: string;
  online: boolean;
  onlineCount: number;
  counts: PresenceCounts;
};

// the server checks the token after "connect" fires, so an emit right after connect can be
// ignored. the public online list confirms it; each emit gets these checks before the next one
const CONFIRM_CHECKS_MS = [1_000, 2_500, 5_000];
const MAX_ONLINE_EMITS = 3;

// a server-side disconnect (refused token, rate limit) is never retried by socket.io itself
const SERVER_DISCONNECT_RETRY_MS = 5_000;

// connection events don't broadcast counts, so the clients count is refreshed while online
const COUNTS_REFRESH_MS = 30_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useConsultantPresence({ userId }: { userId: string }) {
  const socketRef = useRef<Socket | null>(null);
  // set by goOffline and unmount: no reconnect, no state updates
  const stoppedRef = useRef(false);
  // connected = the realtime server lists this consultant as online
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [counts, setCounts] = useState<PresenceCounts>({
    owners: 0,
    clients: 0,
    guests: 0,
    total: 0,
  });

  useEffect(() => {
    if (!userId) return;
    stoppedRef.current = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function refreshCounts() {
      try {
        const fresh = await fetchPresenceCounts();
        if (!stoppedRef.current) setCounts(fresh);
      } catch (err) {
        console.error("[presence] failed to fetch counts:", err);
      }
    }

    async function isListed() {
      try {
        return (await fetchOnlineIds()).includes(userId);
      } catch {
        return false;
      }
    }

    // emits consultant-online again only while the server doesn't list us: every processed
    // emit adds a presence reference on the server, so a second one must never follow a success
    async function goOnline(socket: Socket) {
      for (let emit = 0; emit < MAX_ONLINE_EMITS; emit++) {
        socket.emit("consultant-online");

        for (const ms of CONFIRM_CHECKS_MS) {
          await wait(ms);
          if (stoppedRef.current || socketRef.current !== socket || !socket.connected)
            return;
          if (await isListed()) {
            setConnected(true);
            void refreshCounts();
            return;
          }
        }
      }
      console.error("[presence] the realtime server never listed this consultant");
    }

    async function connect() {
      let socket: Socket;
      try {
        socket = await createRealtimeSocket("user");
      } catch (err) {
        console.error("[presence] failed to load the socket client:", err);
        return;
      }

      // unmounted while loading
      if (stoppedRef.current) {
        socket.disconnect();
        return;
      }
      socketRef.current = socket;

      // every connect is a new socket on the server, so it announces itself again
      socket.on("connect", () => {
        if (stoppedRef.current) return;
        void goOnline(socket);
      });

      socket.on("connect_error", (err) => {
        console.error("[presence] connect_error:", err.message);
      });

      socket.on("disconnect", (reason) => {
        if (stoppedRef.current) return;
        setConnected(false);

        if (reason === "io server disconnect") {
          retryTimer = setTimeout(() => {
            if (!stoppedRef.current) socket.connect();
          }, SERVER_DISCONNECT_RETRY_MS);
        }
      });

      socket.on("presence-changed", (payload: PresenceChanged) => {
        if (stoppedRef.current) return;
        setOnlineCount(payload.onlineCount);
        setCounts(payload.counts);
      });
    }

    void connect();
    const countsTimer = setInterval(() => {
      if (socketRef.current?.connected) void refreshCounts();
    }, COUNTS_REFRESH_MS);

    return () => {
      stoppedRef.current = true;
      if (retryTimer) clearTimeout(retryTimer);
      clearInterval(countsTimer);
      socketRef.current?.emit("consultant-offline");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  // explicit offline on the realtime server (revalidation timeout). the page keeps its current
  // state until the caller navigates away, so nothing flashes before the redirect
  const goOffline = useCallback(() => {
    stoppedRef.current = true;
    socketRef.current?.emit("consultant-offline");
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  return { connected, onlineCount, counts, goOffline };
}
