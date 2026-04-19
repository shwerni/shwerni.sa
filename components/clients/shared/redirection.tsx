"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";

interface Props {
  href: string;
  delay?: number;
}

export default function Redirection({ href, delay = 2000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace(href), delay);
    return () => clearTimeout(t);
  }, [href, delay, router]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
      {/* Spinner */}
      <svg
        className="h-4 w-4 shrink-0 animate-spin text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>

      <ClipboardList className="h-4 w-4 shrink-0" />

      <span className="leading-snug">
        يوجد مقياس مرتبط بهذا الطلب — سيتم تحويلك للإجابة عليه الآن…
      </span>
    </div>
  );
}
