"use client";
// React & Next
import { useEffect } from "react";

// components
import Error404 from "@/components/shared/error-404";

// an error in a site page (e.g. the database didn't answer while an article, consultant or
// program loaded): the site's own error content inside the site header and footer, instead of
// next's bare default page. the failed load isn't cached, so the next request retries
export default function SiteError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[site] page error", error.digest ?? error.name);
  }, [error]);

  return <Error404 />;
}
