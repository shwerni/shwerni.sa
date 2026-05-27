"use client";
// React & Next
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// packages
import useSWR from "swr";

// uploadthing
import { useUploadThing } from "@/lib/upload";

// shadcn
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// prisma data
import { createMeetingMessage, toggleUserBlock } from "@/data/chats";

// schemas
import { type MeetingData, type MeetingMessage } from "@/schemas/chat";

// prisma enums
import { Gender, UserRole } from "@/lib/generated/prisma/enums";

// icons
import {
  Send,
  MoreVertical,
  Calendar,
  Paperclip,
  ImageIcon,
  Loader2,
  Ban,
  ArrowRight, // RTL back arrow
} from "lucide-react";
import { timeZone } from "@/lib/site/time";
import { differenceInHours } from "date-fns";
import MessageBubble from "../bubble";
import AttachmentPreview from "../attachment-preview";

// helpers
const fetcher = (url: string) => fetch(url).then((r) => r.json());

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">{date}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function BlockSeparator({ dateStr }: { dateStr: string }) {
  const time = new Date(dateStr).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-red-200" />
      <span className="text-xs text-red-600 font-bold bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
        تم الحظر - {time}
      </span>
      <div className="flex-1 h-px bg-red-200" />
    </div>
  );
}

// props
interface ChatClientProps {
  mid: string;
  session: number;
  date: string;
  time: string;
  orderOid: number;
  username: string;
  consultant: {
    cid: number;
    name: string;
    image: string | null;
    gender: Gender;
  };
  participantId: string;
  senderRole: UserRole;
  backHref?: string; // ← NEW: where the back button goes
}

type Messages = MeetingMessage & { blocked?: boolean };

export default function ChatClient({
  mid,
  session,
  date,
  time,
  orderOid,
  consultant,
  participantId,
  senderRole,
  username,
  backHref = "/dashboard/chats",
}: ChatClientProps) {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, mutate } = useSWR<
    Omit<MeetingData, "messages"> & { blocked: boolean; messages: Messages[] }
  >(`/api/meetings/${mid}/chat`, fetcher, {
    refreshInterval: 7000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  const { startUpload, isUploading } = useUploadThing("chatAttachment", {
    onClientUploadComplete: () => {},
    onUploadError: (e) => {
      setSendError(e.message);
      setIsSending(false);
    },
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [data?.messages, scrollToBottom]);

  const hasData = !!data;
  useEffect(() => {
    if (hasData) scrollToBottom("instant");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [content]);

  const handleToggleBlock = async () => {
    if (!data) return;
    setIsTogglingBlock(true);
    try {
      await toggleUserBlock(mid, !data.blocked);
      await mutate();
      scrollToBottom("smooth");
    } finally {
      setIsTogglingBlock(false);
    }
  };

  const canSend = content.trim().length > 0 || !!attachment;
  const isBusy = isSending || isUploading;

  const handleSend = async () => {
    if (!canSend || isBusy) return;
    setSendError(null);
    setIsSending(true);
    try {
      let fileUrl: string | undefined;
      let fileType: string | undefined;
      let fileName: string | undefined;

      if (attachment) {
        const uploaded = await startUpload([attachment]);
        if (!uploaded || uploaded.length === 0) {
          setSendError("فشل رفع الملف، يرجى المحاولة مرة أخرى.");
          return;
        }
        fileUrl = uploaded[0].ufsUrl;
        fileType = attachment.type;
        fileName = attachment.name;
      }

      const result = await createMeetingMessage({
        mid,
        content: content.trim(),
        sender: senderRole,
        participantId,
        fileUrl,
        fileType,
        fileName,
      });

      if (!result || result.error) {
        setSendError(
          typeof result?.error === "string"
            ? result.error
            : "فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        );
        return;
      }

      setContent("");
      setAttachment(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await mutate();
      scrollToBottom("smooth");
    } catch {
      setSendError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = (() => {
    if (!data?.messages) return [];
    let blockTimeMs: number | null = null;
    if (data.blocked) {
      const blockMarkers = data.messages.filter((m) => m.blocked === true);
      if (blockMarkers.length > 0) {
        blockTimeMs = new Date(
          blockMarkers[blockMarkers.length - 1].createdAt,
        ).getTime();
      }
    }
    return data.messages.filter((msg: Messages) => {
      const isOwner = senderRole === UserRole.OWNER;
      const isUserMessage = msg.sender !== UserRole.OWNER;
      const msgTimeMs = new Date(msg.createdAt).getTime();
      if (msg.blocked && !isOwner) return false;
      if (
        data.blocked &&
        blockTimeMs !== null &&
        isOwner &&
        isUserMessage &&
        !msg.blocked
      ) {
        if (msgTimeMs >= blockTimeMs) return false;
      }
      return true;
    });
  })();

  const groupedMessages = (() => {
    const groups: Array<{ date: string; messages: Messages[] }> = [];
    for (const msg of visibleMessages) {
      const d = formatDate(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.date === d) {
        last.messages.push(msg);
      } else {
        groups.push({ date: d, messages: [msg] });
      }
    }
    return groups;
  })();

  const isChatExpired = (() => {
    try {
      const meetingDateTime = new Date(`${date}T${time}`);
      if (isNaN(meetingDateTime.getTime())) return false;
      const { iso: nowInRiyadh } = timeZone();
      const diffHours = differenceInHours(nowInRiyadh, meetingDateTime);
      return diffHours >= 72;
    } catch {
      return false;
    }
  })();

  const loadingLabel = isUploading ? "جاري الرفع..." : "جاري الإرسال...";

  return (
    <div
      className="flex flex-col h-[70vh] sm:h-[calc(100vh-4rem)] sm:max-w-4xl sm:mx-auto bg-slate-50 sm:border-x border-slate-200 sm:shadow-sm font-sans"
      dir="rtl"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-slate-200 z-10">
        <div className="flex items-center gap-3">
          {/* Back button — only shown when backHref is provided */}
          <Link
            href={backHref}
            className="p-1.5 -mr-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-100 shadow-sm shrink-0">
            {consultant.image && senderRole !== UserRole.OWNER ? (
              <ConsultantImage
                name={consultant.name}
                image={consultant.image}
                gender={consultant.gender}
                size="sm"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-lg font-semibold">
                {senderRole === UserRole.OWNER
                  ? username[0]
                  : consultant.name?.[0]}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              محادثة الجلسة رقم {session}
            </h2>
            <p className="text-xs sm:text-sm text-theme font-medium truncate">
              التوصيات والتوجيهات
            </p>
            <p className="text-xs font-medium text-slate-500">
              {senderRole === UserRole.OWNER ? username : consultant.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-sm text-slate-500">
          <div className="hidden sm:flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="hidden sm:block bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-medium">
            طلب #{orderOid}
          </div>
          <div className="flex sm:hidden">
            <span className="bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 text-xs font-medium">
              #{orderOid}
            </span>
          </div>

          {senderRole === UserRole.OWNER && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleBlock}
              disabled={isTogglingBlock || !data}
              className={`transition-colors duration-200 ${
                data?.blocked
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                  : "bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border-slate-200"
              }`}
              title={data?.blocked ? "إلغاء الحظر" : "حظر المستخدم"}
            >
              {isTogglingBlock ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Ban className="w-5 h-5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-slate-400"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {data?.blocked && senderRole === UserRole.OWNER && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none bg-white/80 backdrop-blur-sm border-2 border-red-500 shadow-xl rounded-2xl px-6 py-4 flex flex-col items-center gap-2">
            <Ban className="w-8 h-8 text-red-600" />
            <span className="text-red-600 font-bold text-lg text-center whitespace-nowrap">
              تم حظر هذا المستخدم
            </span>
          </div>
        )}

        <ScrollArea className="h-full w-full">
          <div className="px-4 sm:px-6 py-4 space-y-4 min-h-full flex flex-col justify-end">
            {!data ? (
              <div className="flex items-center justify-center flex-1 text-slate-400 gap-2 mt-10">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">جاري تحميل الرسائل...</span>
              </div>
            ) : groupedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-2 mt-10">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Send className="w-5 h-5 rotate-45" />
                </div>
                <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
              </div>
            ) : (
              <div className="flex-1">
                {groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-4 mt-4">
                    <DateSeparator date={group.date} />
                    {group.messages.map((msg) => {
                      if (msg.blocked) {
                        return (
                          <BlockSeparator key={msg.id} dateStr={msg.createdAt} />
                        );
                      }
                      return (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isOwn={msg.sender === senderRole}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} className="h-1 shrink-0" />
          </div>
        </ScrollArea>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {isChatExpired ? (
        <div className="shrink-0 px-3 sm:px-6 py-5 bg-slate-50 border-t border-slate-200 flex flex-col items-center justify-center gap-3 z-10 text-center">
          <div className="flex items-center gap-2 text-slate-500">
            <h3 className="font-semibold text-lg">
              انتهت المحادثة الخاصة بهذه الجلسة
            </h3>
          </div>
          <p className="text-sm text-slate-500 max-w-sm">
            لقد مر 72 ساعة على موعد الجلسة وتم إغلاق المحادثة. يمكنك حجز جلسة
            جديدة أو التحدث مع المستشار مباشرة.
          </p>
          {senderRole !== UserRole.OWNER && (
            <Button
              asChild
              className="mt-2 bg-theme hover:bg-theme/90 text-white rounded-xl"
            >
              <Link href={`/consultants/${consultant.cid}`}>
                تحدث مع المستشار
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="shrink-0 px-3 sm:px-4 py-3 bg-white border-t border-slate-200 space-y-2 z-10">
          {attachment && (
            <div className="px-1">
              <AttachmentPreview
                file={attachment}
                onRemove={() => setAttachment(null)}
              />
            </div>
          )}

          {isUploading && (
            <p className="text-xs text-theme px-1 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              جاري رفع الملف...
            </p>
          )}

          {sendError && (
            <p className="text-xs text-red-500 px-1">{sendError}</p>
          )}

          <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-theme focus-within:ring-1 focus-within:ring-theme transition-all">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isBusy}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept =
                    "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt";
                  fileInputRef.current.click();
                }
              }}
              className="text-slate-400 hover:text-theme rounded-xl shrink-0"
              title="إرفاق ملف"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isBusy}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                }
              }}
              className="text-slate-400 hover:text-theme rounded-xl shrink-0"
              title="إرفاق صورة"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAttachment(file);
                  setSendError(null);
                }
                e.target.value = "";
              }}
            />

            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك..."
              dir="auto"
              rows={1}
              disabled={isBusy}
              className="flex-1 min-h-10 max-h-32 resize-none bg-transparent border-none
                       shadow-none focus-visible:ring-0 py-2.5 text-slate-700
                       placeholder:text-slate-400 text-sm sm:text-base leading-relaxed
                       disabled:opacity-60"
            />

            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isBusy}
              size="icon"
              title={isBusy ? loadingLabel : "إرسال"}
              className="bg-theme hover:bg-theme/90 text-white rounded-xl active:scale-95
                       transition-all disabled:opacity-40 shrink-0"
            >
              {isBusy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}