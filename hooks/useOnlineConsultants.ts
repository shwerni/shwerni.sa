"use client";

// React
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// packages
import type { Socket } from "socket.io-client";

// actions
import { getOnlineConsultantsList } from "@/actions/site";

// utils
import { createRealtimeSocket } from "@/lib/api/realtime/socket-client";
import {
  REFETCH_MAX_MS,
  REFETCH_MIN_MS,
  refetchDelay,
} from "@/lib/api/realtime/online-list-timing";

type ConsultantList = Awaited<ReturnType<typeof getOnlineConsultantsList>>;

// presence-changed as guests get it (no counts); consultantId is the consultant's user id
type PresenceChanged = { consultantId: string; online: boolean };

// a tab coming back refetches, at most this often
const VISIBLE_REFETCH_MIN_MS = 15_000;

// failed connections in a row before live updates stop (the list itself keeps working):
// 2s, 4s, 8s, 16s, 30s apart
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2_000;
const RETRY_MAX_MS = 30_000;
// a connection that stays up this long is healthy (a refused one drops within milliseconds)
const STABLE_MS = 10_000;

interface Options {
  // live updates start once this element scrolls into view (the home section);
  // without it they start on mount (the /instant page)
  liveWhenVisible?: RefObject<Element | null>;
}

// online consultants for clients: the list from the server action, kept live by a guest socket
// on the realtime server (presence-changed). no browser http to the realtime server
export function useOnlineConsultants({ liveWhenVisible }: Options = {}) {
  const [consultants, setConsultants] = useState<ConsultantList>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // the latest request wins: an older answer that lands later is dropped
  const requestRef = useRef(0);
  const inFlightRef = useRef(false);
  const lastFetchRef = useRef(0);

  const fetchList = useCallback(async (showSpinner = false) => {
    const request = ++requestRef.current;
    inFlightRef.current = true;
    lastFetchRef.current = Date.now();
    if (showSpinner) setLoading(true);
    try {
      const list = await getOnlineConsultantsList();
      if (request === requestRef.current) setConsultants(list);
    } finally {
      if (request === requestRef.current) {
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  // the list: on mount, and again when the tab comes back
  useEffect(() => {
    void (async () => {
      await fetchList(false);
    })();

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchRef.current < VISIBLE_REFETCH_MIN_MS) return;
      void fetchList(false);
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchList]);

  // live updates: a guest socket, closed when the page goes away
  useEffect(() => {
    // unmounted, or gave up after the retries
    let stopped = false;
    let socket: Socket | null = null;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let refetchTimer: ReturnType<typeof setTimeout> | null = null;
    let refetchAt = 0;
    // the first change that came too late for the refetch already scheduled (0: none)
    let missedSince = 0;
    let lastChangeAt = 0;
    let stableTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: IntersectionObserver | null = null;

    function scheduleRefetch(delay: number) {
      refetchAt = Date.now() + delay;
      refetchTimer = setTimeout(() => {
        refetchTimer = null;
        if (stopped) return;
        void fetchList(false);

        // one more for the changes it came too early for: at least REFETCH_MIN_MS after the
        // last of them and at most REFETCH_MAX_MS after the first (never an empty window: they
        // all arrived in the REFETCH_MIN_MS before this refetch), spread like any other
        if (missedSince) {
          const now = Date.now();
          const from = Math.max(lastChangeAt + REFETCH_MIN_MS, now);
          const to = Math.max(missedSince + REFETCH_MAX_MS, from);
          missedSince = 0;
          scheduleRefetch(from - now + Math.random() * (to - from));
        }
      }, delay);
    }

    // after a change, refetch at a random moment REFETCH_MIN_MS..REFETCH_MAX_MS later: visitors
    // spread out, and the server's cached list is always newer than the change
    // (lib/api/realtime/online-list-timing.ts). one refetch covers a burst of changes
    function refetchAfterChange() {
      const now = Date.now();
      lastChangeAt = now;
      if (!refetchTimer) return scheduleRefetch(refetchDelay());
      if (refetchAt < now + REFETCH_MIN_MS && !missedSince) missedSince = now;
    }

    // one more failed connection, retried with backoff; past the cap live updates stop quietly
    function retryLater(action: () => void) {
      failures += 1;
      if (failures > MAX_RETRIES) {
        stopped = true;
        socket?.disconnect();
        return;
      }

      const delay = Math.min(RETRY_BASE_MS * 2 ** (failures - 1), RETRY_MAX_MS);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (!stopped) action();
      }, delay);
    }

    async function connect() {
      let s: Socket;
      try {
        // every retry goes through retryLater, so one cap covers them all
        s = await createRealtimeSocket("guest", { reconnection: false });
      } catch {
        return retryLater(() => void connect());
      }

      // ended while loading
      if (stopped) {
        s.disconnect();
        return;
      }
      socket = s;

      s.on("connect", () => {
        if (stopped) return;
        stableTimer = setTimeout(() => {
          failures = 0;
        }, STABLE_MS);
        // changes before this connection (the page load, a lazy start, a drop) are fetched again
        refetchAfterChange();
      });

      // the connection never opened (network, cors, server down, rate limit)
      s.on("connect_error", () => {
        if (!stopped) retryLater(() => s.connect());
      });

      // a drop, or a server-side disconnect (refused token, rate limit)
      s.on("disconnect", () => {
        if (stopped) return;
        if (stableTimer) clearTimeout(stableTimer);
        retryLater(() => s.connect());
      });

      // offline: removed at once; online: the list is fetched again (the event has no card data)
      s.on("presence-changed", (change: PresenceChanged) => {
        if (stopped) return;
        if (change.online) return refetchAfterChange();

        setConsultants((prev) =>
          prev.filter((c) => c.userId !== change.consultantId),
        );
        // an answer already on its way may still list them: drop it and ask again
        if (inFlightRef.current) {
          requestRef.current += 1;
          refetchAfterChange();
        }
      });
    }

    const target = liveWhenVisible?.current;
    if (target && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer?.disconnect();
        observer = null;
        void connect();
      });
      observer.observe(target);
    } else {
      void connect();
    }

    return () => {
      stopped = true;
      observer?.disconnect();
      if (retryTimer) clearTimeout(retryTimer);
      if (refetchTimer) clearTimeout(refetchTimer);
      if (stableTimer) clearTimeout(stableTimer);
      socket?.disconnect();
      socket = null;
    };
  }, [fetchList, liveWhenVisible]);

  return { consultants, loading, refetch: () => fetchList(true) };
}
