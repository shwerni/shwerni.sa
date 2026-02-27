"use client";
import { useEffect, useState } from "react";
import type { PresenceChannel } from "pusher-js";
import { createPusherClient } from "@/lib/api/pusher/pusher-client";

export function useConsultantPresence({ userId }: { userId: string }) {
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const pusher = createPusherClient(userId);
    const channel = pusher.subscribe("presence-consultants") as PresenceChannel;

    channel.bind("pusher:subscription_succeeded", (data: { count: number; members: Record<string, unknown> }) => {
      setConnected(true);
      setOnlineCount(data.count ?? Object.keys(data.members ?? {}).length);
    });

    channel.bind("pusher:subscription_error", () => {
      setConnected(false);
    });

    channel.bind("pusher:member_added", () => {
      setOnlineCount((prev) => prev + 1);
    });

    channel.bind("pusher:member_removed", () => {
      setOnlineCount((prev) => Math.max(0, prev - 1));
    });

    return () => {
      pusher.unsubscribe("presence-consultants");
      pusher.disconnect();
    };
  }, [userId]);

  return { connected, onlineCount };
}