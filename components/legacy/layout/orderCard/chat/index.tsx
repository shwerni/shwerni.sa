"use client";

// React & Next
import React from "react";
import Link from "next/link";

// icons
import { CircleAlert } from "lucide-react";

// props
interface Props {
  mid: string;
  participantId: string;
  firstMessage: string | null;
}

// return default
export default function OrderReason({
  mid,
  participantId,
  firstMessage,
}: Props) {
  return (
    <Link
      href={`/chats/${mid}?participant=${participantId}`}
      className="flex flex-col gap-1 w-full mx-auto my-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg transition-all"
    >
      <div className="flex items-center gap-2">
        <CircleAlert className="w-5 text-zblue-200" />
        <span className="font-medium text-slate-800">
          المحادثة والتوجيهات
        </span>
      </div>
      
      {/* عرض أول رسالة كنبذة أو رسالة افتراضية */}
      <div className="pr-7">
        {firstMessage ? (
          <p className="text-sm text-slate-600 line-clamp-2">
            {firstMessage}
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            لا توجد رسائل بعد...
          </p>
        )}
      </div>
    </Link>
  );
}