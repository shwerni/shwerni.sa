"use client";
import { useEffect, useState } from "react";
import { createPusherClient } from "@/lib/api/pusher/pusher-client";
import type { PresenceChannel } from "pusher-js";

export function useConsultantPresence({ userId }: { userId: string }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Simply connecting triggers the 'member_added' Webhook
    const pusher = createPusherClient(userId);
    const channel = pusher.subscribe("presence-consultants") as PresenceChannel;

    channel.bind("pusher:subscription_succeeded", () => setConnected(true));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pusher.connection.bind("state_change", (states: any) => {
      setConnected(states.current === "connected");
    });

    return () => {
      // Unmounting/closing tab triggers the 'member_removed' Webhook
      pusher.unsubscribe("presence-consultants");
      pusher.disconnect();
    };
  }, [userId]);

  return { connected };
}