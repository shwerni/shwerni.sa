"use client";
import { useEffect, useState, useCallback } from "react";
import { createPusherClient } from "@/lib/api/pusher/pusher-client";
import { getOnlineConsultantsList } from "@/data/online";

// Uses the return type from our server action
type ConsultantList = Awaited<ReturnType<typeof getOnlineConsultantsList>>;

export function useOnlineConsultants() {
  const [consultants, setConsultants] = useState<ConsultantList>([]);
  const [loading, setLoading] = useState<boolean>(true); // Starts true on initial mount

  const fetchList = useCallback(async (showSpinner = false) => {
    // Only trigger a React state update if we explicitly ask for a spinner
    if (showSpinner) {
      setLoading(true);
    }
    
    try {
      const list = await getOnlineConsultantsList();
      setConsultants(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial fetch: loading is already true from useState, 
    // so we pass 'false' to avoid the synchronous double-render error.
    fetchList(false);

    const pusher = createPusherClient("guest");
    const channel = pusher.subscribe("public-consultant-status");

    // 2. Real-time background fetch: 
    // Pass 'false' so the UI doesn't flash a spinner while someone joins/leaves.
    // They will just smoothly pop into (or disappear from) the list.
    channel.bind("status-changed", () => {
      fetchList(false);
    });

    return () => pusher.unsubscribe("public-consultant-status");
  }, [fetchList]);

  // If a user clicks a manual "Refresh" button in your UI, it will show the spinner
  return { consultants, loading, refetch: () => fetchList(true) };
}