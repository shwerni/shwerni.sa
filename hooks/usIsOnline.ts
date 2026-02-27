"use client";
import { useEffect, useState } from "react";
import { checkIsAnyConsultantOnline } from "@/data/online";
import { createPusherClient } from "@/lib/api/pusher/pusher-client";

export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    checkIsAnyConsultantOnline().then((status) => {
      setIsOnline(status);
    });

    const pusher = createPusherClient("guest");
    const channel = pusher.subscribe("public-consultant-status");

    channel.bind("status-changed", (data: { anyOnline: boolean }) => {
      setIsOnline(data.anyOnline);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("public-consultant-status");
    };
  }, []);

  return { isOnline };
}
