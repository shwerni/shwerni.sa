"use client";
import { useEffect, useRef } from "react";
import { useNotifStore } from "@/hooks/zustand/order-notification";
import { getPaidPast3Days } from "@/data/order/reserveation";

function maskName(name: string): string {
  const n = name.trim();
  if (n.length <= 2) return n[0] + "*";
  if (n.length === 3) return n[0] + "*" + n[n.length - 1];
  return n[0] + "*".repeat(n.length - 2) + n[n.length - 1];
}

export function OrderNotificationBanner() {
  // Removed pushRealtime since the live stream is gone
  const { current, history, dismiss, initDrip } = useNotifStore();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  };

  useEffect(() => {
    // Fetches the past 30 days of orders and drips them. No active listener.
    getPaidPast3Days().then((orders) => initDrip(orders));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!current) return;
    clearHide();
    hideTimerRef.current = setTimeout(() => dismiss(), 7000);
    return clearHide;
  }, [current?.orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isVisible = !!current;
  const p = current?.palette ?? history[0]?.palette;
  if (!p) return null;

  return (
    <div
      dir="rtl"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage: `linear-gradient(${p.bg}, ${p.bg})`,
      }}
      className={[
        "fixed top-16 sm:top-17 left-0 right-0 z-50 flex items-center justify-start sm:justify-center gap-2.5",
        "px-5 py-2.5 text-sm border-b border-slate-200/50 select-none",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isVisible
          ? "translate-y-0 opacity-100 shadow-sm"
          : "-translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0 animate-pulse"
        style={{ background: p.dot }}
      />
      <span className="text-base select-none">{current?.emoji}</span>
      <div className="flex items-center gap-1.5 flex-wrap justify-start sm:justify-center text-start sm:text-center">
        <span className="text-slate-600 font-medium">قام العميل</span>
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border"
          style={{
            backgroundColor: "#ffffff",
            backgroundImage: `linear-gradient(${p.chipBg}, ${p.chipBg})`,
            color: p.chipColor,
            borderColor: p.chipBorder,
          }}
        >
          {maskName(current?.clientName ?? "")}
        </span>
        <span className="text-slate-600 font-medium">
          بحجز جلسة جديدة مع المستشار
        </span>
        <span
          className="inline-flex items-start sm:items-center rounded-md px-2 py-0.5 text-xs font-bold border"
          style={{
            backgroundColor: "#ffffff",
            backgroundImage: `linear-gradient(${p.chipBg}, ${p.chipBg})`,
            color: p.chipColor,
            borderColor: p.chipBorder,
          }}
        >
          {current?.consultantName}
        </span>
      </div>
      <span
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${p.dot}44, ${p.dot})` }}
      />
    </div>
  );
}