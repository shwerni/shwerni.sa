"use client";

// React
import { useEffect, useRef, useState } from "react";

// packages
import { io, Socket } from "socket.io-client";

export function useConsultantPresence({ userId }: { userId: string }) {
  const socketRef = useRef<Socket | null>(null);
  const connectingRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    if (connectingRef.current || socketRef.current) return;

    connectingRef.current = true;
    let mounted = true;

    async function connect() {
      console.log("[presence] fetching realtime token...");
      const res = await fetch("/api/realtime-token");
      console.log("[presence] token endpoint responded with status:", res.status);

      const { token } = await res.json();
      console.log("[presence] token received:", token ? "present" : "missing");

      if (!mounted) return;

      const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
      console.log("[presence] connecting socket to:", socketUrl);

      const socket = io(socketUrl, { auth: { token } });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[presence] socket connected:", socket.id);
        if (!mounted) return;
        setConnected(true);
        socket.emit("consultant-online");
        console.log("[presence] emitted consultant-online");
      });

      socket.on("connect_error", (err) => {
        console.error("[presence] connect_error:", err.message);
      });

      socket.on("disconnect", (reason) => {
        console.log("[presence] socket disconnected:", reason);
        if (!mounted) return;
        setConnected(false);
      });

      socket.on(
        "presence-changed",
        (payload: { consultantId: string; online: boolean; onlineCount: number }) => {
          console.log("[presence] presence-changed received:", payload);
          if (!mounted) return;
          setOnlineCount(payload.onlineCount);
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

  return { connected, onlineCount };
}