"use client";
import { useEffect, useState, useCallback } from "react";
import type PusherClient from "pusher-js";
import { getOnlineConsultantsList } from "@/actions/site";

type ConsultantList = Awaited<ReturnType<typeof getOnlineConsultantsList>>;
type ConsultantItem = ConsultantList[number];

type StatusChangedPayload = {
  userId: string;
  isOnline: boolean;
  consultant: ConsultantItem;
  anyOnline: boolean;
  onlineCount: number;
};

export function useOnlineConsultants() {
  const [consultants, setConsultants] = useState<ConsultantList>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchList = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const list = await getOnlineConsultantsList();
      setConsultants(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchList(false);
    })();
    
    // pusher-js is loaded after mount, so it isn't part of the page's first-load javascript;
    // the subscription already started after mount, so the timing is the same
    let cancelled = false;
    let pusher: PusherClient | null = null;
    let channel: ReturnType<PusherClient["subscribe"]> | null = null;

    void import("@/lib/api/pusher/pusher-client").then(({ createPusherClient }) => {
      // unmounted while loading
      if (cancelled) return;

      pusher = createPusherClient("guest");
      channel = pusher.subscribe("public-consultant-status");

      channel.bind("status-changed", (data: StatusChangedPayload) => {
        setConsultants((prev) => {
          if (data.isOnline) {
            const exists = prev.some((c) => c.userId === data.userId);
            return exists ? prev : [...prev, data.consultant];
          } else {
            return prev.filter((c) => c.userId !== data.userId);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      channel?.unbind_all();
      pusher?.unsubscribe("public-consultant-status");
    };
  }, [fetchList]);

  return { consultants, loading, refetch: () => fetchList(true) };
}
