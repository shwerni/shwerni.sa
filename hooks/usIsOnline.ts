"use client";
import { useEffect, useState } from "react";
import { createPusherClient } from "@/lib/api/pusher/pusher-client";
import { checkIsAnyConsultantOnline } from "@/data/online";

export function useIsOnline() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Cheap initial fetch
    checkIsAnyConsultantOnline().then((status) => {
      setIsOnline(status);
      setLoading(false);
    });

    // 2. Connect to free public channel
    const pusher = createPusherClient("guest");
    const channel = pusher.subscribe("public-consultant-status");

    // 3. Listen for the tiny boolean broadcast
    channel.bind("status-changed", (data: { isOnline: boolean }) => {
      setIsOnline(data.isOnline);
    });

    return () => pusher.unsubscribe("public-consultant-status");
  }, []);

  return { isOnline, loading };
}