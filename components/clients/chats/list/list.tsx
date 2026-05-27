"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { UserRole, Gender } from "@/lib/generated/prisma/enums";
import { Loader2, MessageCircle, Search, FileText, Image } from "lucide-react";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatPreview {
  mid: string;
  session: number;
  date: string;
  time: string;
  orderOid: number;
  clientName: string;
  consultant: {
    cid: number;
    name: string;
    image: string | null;
    gender: Gender;
  };
  unreadCount: number;
  lastMessage: {
    content: string;
    fileType: string | null;
    createdAt: string;
    sender: UserRole;
  } | null;
  myParticipantId: string | null;
  otherParticipantId: string | null;
}

interface ChatListClientProps {
  author: string; // user.id from session
  role: UserRole;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: ar,
    });
  } catch {
    return "";
  }
}

function lastMessagePreview(
  msg: ChatPreview["lastMessage"],
  myRole: UserRole,
): string {
  if (!msg) return "لا توجد رسائل بعد";
  const prefix = msg.sender === myRole ? "أنت: " : "";
  if (msg.fileType?.startsWith("image/")) return `${prefix}📷 صورة`;
  if (msg.fileType) return `${prefix}📎 ملف مرفق`;
  if (msg.content) return `${prefix}${msg.content}`;
  return "لا توجد رسائل بعد";
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  image,
  gender,
  isConsultant,
}: {
  name: string;
  image: string | null;
  gender: Gender;
  isConsultant: boolean;
}) {
  if (isConsultant && image) {
    return (
      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow">
        <ConsultantImage name={name} image={image} gender={gender} size="sm" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-full shrink-0 ring-2 ring-white shadow bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-lg">
      {name?.[0] ?? "?"}
    </div>
  );
}

// ─── Chat Row ─────────────────────────────────────────────────────────────────

function ChatRow({ chat, role }: { chat: ChatPreview; role: UserRole }) {
  const isOwner = role === UserRole.OWNER;
  // For clients → show consultant. For owners → show client name.
  const displayName = isOwner ? chat.clientName : chat.consultant.name;
  const preview = lastMessagePreview(chat.lastMessage, role);
  const ago = chat.lastMessage ? timeAgo(chat.lastMessage.createdAt) : "";
  const href = `/dashboard/chats/${chat.mid}?participant=${chat.myParticipantId ?? ""}`;

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 cursor-pointer border-b border-slate-100 last:border-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar
            name={displayName}
            image={isOwner ? null : chat.consultant.image}
            gender={chat.consultant.gender}
            isConsultant={!isOwner}
          />
          {/* Online dot placeholder — can wire to presence later */}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900 text-sm truncate">
              {displayName}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
              {ago}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-slate-500 truncate leading-relaxed">
              {preview}
            </p>
            {/* {chat.unreadCount > 0 && (
              <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-theme text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </span>
            )} */}
          </div>

          {/* Sub-line: session + order */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
              جلسة #{chat.session}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
              طلب #{chat.orderOid}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatListClient({ author, role }: ChatListClientProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useSWR<{ chats: ChatPreview[] }>(
    `/api/meetings/chats?author=${author}&role=${role}`,
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: true },
  );

  const chats = data?.chats ?? [];

  const filtered = chats.filter((c) => {
    const q = search.toLowerCase();
    const name = role === UserRole.OWNER ? c.clientName : c.consultant.name;
    return (
      !q ||
      name.toLowerCase().includes(q) ||
      String(c.orderOid).includes(q) ||
      String(c.session).includes(q)
    );
  });

  return (
    <div
      className="flex flex-col bg-white h-[calc(100vh-4rem)] sm:max-w-xl sm:mx-auto sm:border-x border-slate-200 sm:shadow-sm font-sans"
      dir="rtl"
    >
      {/* Header */}
      <header className="shrink-0 px-4 pt-5 pb-3 bg-white border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">المحادثات</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            {chats.length} نشطة
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المحادثات..."
            className="w-full bg-slate-100 border-0 rounded-xl pr-9 pl-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-theme/30 transition"
          />
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">جاري تحميل المحادثات...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="font-semibold text-slate-600 text-base">
                {search ? "لا نتائج" : "لا توجد محادثات نشطة"}
              </p>
              <p className="text-sm mt-1 text-slate-400">
                {search
                  ? "حاول بحثاً مختلفاً"
                  : "ستظهر محادثاتك النشطة هنا خلال 72 ساعة من الجلسة"}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {filtered.map((chat) => (
              <ChatRow key={chat.mid} chat={chat} role={role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
