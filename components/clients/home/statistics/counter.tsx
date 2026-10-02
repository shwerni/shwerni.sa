"use client";
// React & Next
import React from "react";
// node's default locale on the server (vercel included)
const SERVER_LOCALE = "en-US";

// nothing to subscribe to: only the server/browser split of useSyncExternalStore is needed
const noopSubscribe = () => () => {};

// props
interface Props {
  value: number;
  delay?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
}
export const Counter = ({
  value,
  delay = 0,
  duration = 2000,
  decimals = 0,
  suffix = "+",
}: Props) => {
  const [count, setCount] = React.useState(0);

  // the number is formatted with the visitor's locale (arabic browsers show ٠١٢…). the server and
  // the prerendered shell have no browser locale, so the first render uses SERVER_LOCALE on both
  // sides (no hydration mismatch, react #418) and switches to the visitor's locale right after
  const inBrowser = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const ref = React.useRef<HTMLHeadingElement | null>(null);
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const factor = Math.pow(10, decimals);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        let start: number | null = null;
        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = timestamp - start;
          const current = Math.min(
            Math.round((progress / duration) * value * factor) / factor,
            value,
          );
          setCount(current);
          if (progress < duration) requestAnimationFrame(step);
        };
        setTimeout(() => {
          requestAnimationFrame(step);
        }, delay);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, delay, duration, decimals]);
  return (
    <h5 className="text-theme-200 font-semibold text-2xl sm:text-4xl" ref={ref}>
      {count.toLocaleString(inBrowser ? undefined : SERVER_LOCALE, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </h5>
  );
};