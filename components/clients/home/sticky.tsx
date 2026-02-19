"use client";
// packages
import useSWR from "swr";

// components
import { LinkButton } from "@/components/shared/link-button";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Sticky = () => {
  // SWR to fetch hotline availability
  const { data, error } = useSWR("/api/hotline", fetcher, {
    refreshInterval: 15000,
    errorRetryCount: 1,
    errorRetryInterval: 10000,
  });

  const hotlineAvailable = data && data.length > 0;

  return (
    hotlineAvailable && (
      <div className="sticky top-16 sm:top-17 flex items-center justify-center gap-4 inset-x-0  bg-slate-100 py-3 z-50">
        <h5 className="font-medium">الخط الساخن متاح، احجز بشكل فوري</h5>
        <LinkButton className="bg-green-800 text-white" href="/instant">
          احجز الآن
        </LinkButton>
      </div>
    )
  );
};

export default Sticky;
