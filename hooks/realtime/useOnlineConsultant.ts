"use client";

// React
import { useEffect, useRef, useState } from "react";

// packages
import { io, Socket } from "socket.io-client";

type Counts = {
  owners: number;
  clients: number;
  guests: number;
  total: number;
};

export function useConsultantPresence({ userId }: { userId: string }) {
  const socketRef = useRef<Socket | null>(null);
  const connectingRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [counts, setCounts] = useState<Counts>({
    owners: 0,
    clients: 0,
    guests: 0,
    total: 0,
  });

  useEffect(() => {
    if (!userId) return;
    if (connectingRef.current || socketRef.current) return;
    connectingRef.current = true;
    let mounted = true;

    async function fetchCounts() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/presence/counts`,
        );
        const freshCounts = await res.json();
        if (mounted) setCounts(freshCounts);
      } catch (err) {
        console.error("[presence] failed to fetch initial counts:", err);
      }
    }

    async function connect() {
      const res = await fetch("/api/realtime-token");
      const { token } = await res.json();

      if (!mounted) return;

      const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
      const socket = io(socketUrl, { auth: { token } });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (!mounted) return;
        setConnected(true);
        socket.emit("consultant-online");
        // get the real current snapshot the moment we connect
        void fetchCounts();
      });

      socket.on("connect_error", (err) => {
        console.error("[presence] connect_error:", err.message);
      });

      socket.on("disconnect", () => {
        if (!mounted) return;
        setConnected(false);
      });

      socket.on(
        "presence-changed",
        (payload: {
          consultantId: string;
          online: boolean;
          onlineCount: number;
          counts: Counts;
        }) => {
          if (!mounted) return;
          setOnlineCount(payload.onlineCount);
          setCounts(payload.counts);
        },
      );
    }

    void connect();

    return () => {
      mounted = false;
      connectingRef.current = false;
      socketRef.current?.emit("consultant-offline");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return { connected, onlineCount, counts };
}
// "use client";

// // React
// import { useEffect, useRef, useState } from "react";

// // packages
// import { io, Socket } from "socket.io-client";

// type Counts = {
//   owners: number;
//   clients: number;
//   guests: number;
//   total: number;
// };

// export function useConsultantPresence({ userId }: { userId: string }) {
//   const socketRef = useRef<Socket | null>(null);
//   const connectingRef = useRef(false);
//   const [connected, setConnected] = useState(false);
//   const [onlineCount, setOnlineCount] = useState(0);
//   const [counts, setCounts] = useState<Counts>({
//     owners: 0,
//     clients: 0,
//     guests: 0,
//     total: 0,
//   });

//   useEffect(() => {
//     if (!userId) return;
//     if (connectingRef.current || socketRef.current) return;

//     connectingRef.current = true;
//     let mounted = true;

//     async function connect() {
//       const res = await fetch("/api/realtime-token");
//       const { token } = await res.json();

//       if (!mounted) return;

//       const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
//       const socket = io(socketUrl, { auth: { token } });
//       socketRef.current = socket;

//       socket.on("connect", () => {
//         if (!mounted) return;
//         setConnected(true);
//         socket.emit("consultant-online");
//       });

//       socket.on("connect_error", (err) => {
//         console.error("[presence] connect_error:", err.message);
//       });

//       socket.on("disconnect", () => {
//         if (!mounted) return;
//         setConnected(false);
//       });

//       socket.on(
//         "presence-changed",
//         (payload: {
//           consultantId: string;
//           online: boolean;
//           onlineCount: number;
//           counts: Counts;
//         }) => {
//           if (!mounted) return;
//           setOnlineCount(payload.onlineCount);
//           setCounts(payload.counts);
//         },
//       );
//     }

//     void connect();

//     return () => {
//       mounted = false;
//       connectingRef.current = false;
//       socketRef.current?.emit("consultant-offline");
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//     };
//   }, [userId]);

//   // separate, independent effect: whenever we transition to connected,
//   // fetch a fresh snapshot — decoupled from the socket event closure so it
//   // can't be affected by a stale closure from a discarded connection attempt
//   useEffect(() => {
//     if (!connected) return;

//     let cancelled = false;

//     async function fetchCounts() {
//       try {
//         const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presence/counts`);
//         const freshCounts = await res.json();
//         if (!cancelled) setCounts(freshCounts);
//       } catch (err) {
//         console.error("[presence] failed to fetch initial counts:", err);
//       }
//     }

//     void fetchCounts();

//     return () => {
//       cancelled = true;
//     };
//   }, [connected]);

//   return { connected, onlineCount, counts };
// }
