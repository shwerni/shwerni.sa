"use client";
// React & Next
import { useSyncExternalStore } from "react";

// packages
import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/next";

// constants
import { NO_TRACKING_PATH } from "@/constants/tracking";

const noop = () => () => {};
const offHere = (url: string) => {
  try {
    return NO_TRACKING_PATH.test(new URL(url, location.origin).pathname);
  } catch {
    return false;
  }
};

// vercel speed insights, except on the no-tracking pages (constants/tracking.ts). decided in the
// browser from the url the page was loaded with (the server renders nothing, as before: the
// script is injected after hydration), so the static shell is the same for every route. events
// from a no-tracking url are dropped too, in case one is reached by a client navigation
export function SpeedInsights() {
  const enabled = useSyncExternalStore(
    noop,
    () => !offHere(location.href),
    () => false,
  );

  if (!enabled) return null;

  return (
    <VercelSpeedInsights beforeSend={(event) => (offHere(event.url) ? null : event)} />
  );
}
