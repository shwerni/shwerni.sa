"use client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-theme transition-colors group"
    >
      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      <span>العودة للأسئلة</span>
    </button>
  );
}