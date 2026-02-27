"use client";
// components
import { LinkButton } from "@/components/shared/link-button";

// hooks
import { useIsOnline } from "@/hooks/usIsOnline";

const Sticky = () => {
  // check if online
  const { isOnline } = useIsOnline();

  return isOnline ? (
    <div className="sticky top-16 sm:top-17 flex items-center justify-center gap-4 inset-x-0  bg-slate-100 py-3 z-50">
      <h5 className="font-medium">الخط الساخن متاح، احجز بشكل فوري</h5>
      <LinkButton className="bg-green-800 text-white" href="/instant">
        احجز الآن
      </LinkButton>
    </div>
  ) : null;
};

export default Sticky;
