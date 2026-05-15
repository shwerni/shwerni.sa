'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const OrderNotificationBanner = dynamic(
  () => import('./notification').then((m) => m.OrderNotificationBanner),
  { ssr: false }
);

export function OrderNotification() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    // wait until page is fully idle before mounting
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setMount(true), { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    // fallback for Safari
    const t = setTimeout(() => setMount(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!mount) return null;
  return <OrderNotificationBanner />;
}