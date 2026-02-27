"use client";
import { useEffect, useState, useCallback } from "react";
import { createPusherClient } from "@/lib/api/pusher/pusher-client";
import { getOnlineConsultantsList } from "@/data/online";

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
    fetchList(false);

    const pusher = createPusherClient("guest");
    const channel = pusher.subscribe("public-consultant-status");

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

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("public-consultant-status");
    };
  }, [fetchList]);

  return { consultants, loading, refetch: () => fetchList(true) };
}