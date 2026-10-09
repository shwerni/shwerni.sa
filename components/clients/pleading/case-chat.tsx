"use client";
// React & Next
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// uploadthing
import { useUploadThing } from "@/lib/upload";

// components
import MessageBubble from "@/components/clients/chats/bubble";
import AttachmentPreview from "@/components/clients/chats/attachment-preview";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { PleadingStateBadge } from "@/components/clients/pleading/state-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// hooks
import { usePleadingCase } from "@/components/clients/pleading/use-case";

// actions
import {
  sendPleadingClientMessage,
  sendPleadingOwnerMessage,
} from "@/actions/pleading";

// prisma types
import { Gender, UserRole } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/utils/utils";
import { baseActionErrors } from "@/utils/action-errors";
import {
  DOCX_MIME,
  isPleadingChatOpen,
  PLEADING_FILE_ACCEPT,
  pleadingClosedNotes,
  pleadingErrors,
} from "@/utils/pleading";

// icons
import {
  ArrowRight,
  ImageIcon,
  Loader2,
  Lock,
  Paperclip,
  Send,
} from "lucide-react";

// helpers
const errorMessages: Record<string, string> = {
  ...baseActionErrors,
  ...pleadingErrors,
};

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

// props
interface Props {
  plid: number;
  // the viewer: OWNER on the consultant dashboard, USER on the client's case page
  role: typeof UserRole.OWNER | typeof UserRole.USER;
  // the client's link token (client page only; the consultant uses their session)
  token?: string;
  // the other side, shown in the header (the consultant's photo for the client)
  counterpart: { name: string; image?: string | null; gender?: Gender };
  backHref?: string;
  className?: string;
}

// the pleading case chat: same look as the meeting chat (ChatClient), polled from
// /api/pleadings/[plid]/chat. read-only once the case is closed
export function CaseChat({
  plid,
  role,
  token,
  counterpart,
  backHref,
  className,
}: Props) {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // swr polling, shared with the case panel
  const { data, mutate } = usePleadingCase(plid, token);

  // uploadThing
  const { startUpload, isUploading } = useUploadThing("pleadingAttachment", {
    onClientUploadComplete: () => {},
    onUploadError: (e) => {
      setSendError(e.message);
      setIsSending(false);
    },
  });

  // scroll helpers
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

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [content]);

  // submit
  const canSend = content.trim().length > 0 || !!attachment;
  const isBusy = isSending || isUploading;

  const handleSend = async () => {
    if (!canSend || isBusy) return;

    setSendError(null);
    setIsSending(true);

    try {
      let file: { url: string; type: string; name: string } | null = null;

      if (attachment) {
        const uploaded = await startUpload([attachment], { plid, token });
        if (!uploaded || uploaded.length === 0) {
          setSendError("فشل رفع الملف، يرجى المحاولة مرة أخرى.");
          return;
        }
        file = {
          url: uploaded[0].ufsUrl,
          // some browsers give a .docx no type
          type:
            attachment.type ||
            (/\.docx$/i.test(attachment.name) ? DOCX_MIME : ""),
          name: attachment.name,
        };
      }

      const message = { content: content.trim(), file };
      const result =
        role === UserRole.OWNER
          ? await sendPleadingOwnerMessage({ plid, ...message })
          : await sendPleadingClientMessage({ token: token ?? "", ...message });

      if (!result.ok) {
        setSendError(errorMessages[result.error] ?? errorMessages.server_error);
        // the case may have closed meanwhile: refresh the state
        if (result.error === "closed") await mutate();
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

  // group messages by date
  const groupedMessages = (() => {
    const groups: Array<{ date: string; messages: NonNullable<typeof data>["messages"] }> = [];
    for (const msg of data?.messages ?? []) {
      const d = formatDate(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.date === d) last.messages.push(msg);
      else groups.push({ date: d, messages: [msg] });
    }
    return groups;
  })();

  // read-only once the case is closed
  const isOpen = !data || isPleadingChatOpen(data.state);

  // labels
  const loadingLabel = isUploading ? "جاري الرفع..." : "جاري الإرسال...";

  return (
    <div
      className={cn(
        "flex flex-col h-[70vh] sm:h-[calc(100vh-4rem)] bg-slate-50 sm:border-x border-slate-200 sm:shadow-sm font-sans",
        className,
      )}
      dir="rtl"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-slate-200 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="p-1.5 -mr-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-100 shadow-sm shrink-0">
            {counterpart.image && counterpart.gender ? (
              <ConsultantImage
                name={counterpart.name}
                image={counterpart.image}
                gender={counterpart.gender}
                size="sm"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-lg font-semibold">
                {counterpart.name?.[0]}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              طلب مرافعة رقم {plid}
            </h2>
            <p className="text-xs font-medium text-slate-500 truncate">
              {counterpart.name}
            </p>
          </div>
        </div>

        {data && <PleadingStateBadge state={data.state} />}
      </header>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
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
                <p className="text-sm">لا توجد رسائل بعد.</p>
              </div>
            ) : (
              <div className="flex-1">
                {groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-4 mt-4">
                    <DateSeparator date={group.date} />
                    {group.messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isOwn={msg.sender === role}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} className="h-1 shrink-0" />
          </div>
        </ScrollArea>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {!isOpen && data ? (
        <div className="shrink-0 px-3 sm:px-6 py-5 bg-slate-50 border-t border-slate-200 flex flex-col items-center justify-center gap-2 z-10 text-center">
          <div className="flex items-center gap-2 text-slate-500">
            <Lock className="w-4 h-4" />
            <h3 className="font-semibold text-base">المحادثة مغلقة</h3>
          </div>
          <p className="text-sm text-slate-500 max-w-sm">
            {pleadingClosedNotes[data.state]}
          </p>
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
              disabled={isBusy || !data}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = PLEADING_FILE_ACCEPT;
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
              disabled={isBusy || !data}
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
              accept={PLEADING_FILE_ACCEPT}
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
              disabled={isBusy || !data}
              className="flex-1 min-h-10 max-h-32 resize-none bg-transparent border-none
                       shadow-none focus-visible:ring-0 py-2.5 text-slate-700
                       placeholder:text-slate-400 text-sm sm:text-base leading-relaxed
                       disabled:opacity-60"
            />

            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isBusy || !data}
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
