"use client";
// React
import React, { useEffect, useRef, useState } from "react";

// packages
import Linkify from "linkify-react";

// components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// icons
import { Bot, Send } from "lucide-react";

// lib
import { cn } from "@/lib/utils";
import { SendChatBot } from "@/lib/api/ai/chat-bot";

// hooks
import { timeZone } from "@/lib/site/time";

// linkify
const linkifyOptions = {
  rel: "noopener noreferrer",
  className: "text-blue-600 underline",
};

// ─── WhatsApp support number ──────────────────────────────────────────────────
const WHATSAPP_URL = `https://wa.me/966554117879?text=${encodeURIComponent("مرحباً، أريد التحدث مع أحد مستشاري شاورني 👋")}`;

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  loading?: boolean;
}

interface ChatProps {
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

// Extracted as a pure component — avoids re-rendering all messages on each keystroke
const MessageBubble = React.memo(({ message }: { message: Message }) => (
  <div
    className={cn(
      "flex animate-fade-in",
      message.sender === "user" ? "justify-end" : "justify-start",
    )}
  >
    <div
      className={cn(
        "max-w-[80%] p-3 rounded-lg",
        message.sender === "user"
          ? "bg-zblue-200 text-white"
          : "bg-secondary text-gray-800",
      )}
    >
      {message.loading ? (
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
        </div>
      ) : (
        <p
          dir="rtl"
          className={cn(
            "text-xs text-right font-medium leading-4 wrap-break-word",
            message.sender === "user" ? "text-white" : "text-gray-800",
          )}
        >
          <Linkify options={linkifyOptions}>{message.text}</Linkify>
        </p>
      )}

      {!message.loading && (
        <span className="text-xs opacity-70 mt-1 block">
          {message.timestamp.toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  </div>
));
MessageBubble.displayName = "MessageBubble";

const BotChat = ({ onClose, setMessages, messages }: ChatProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // rAF keeps this off the main thread during render
    const raf = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages]);

  const handleSend = React.useCallback(async () => {
    if (!input.trim() || isSending) return;

    const { iso } = timeZone();
    setIsSending(true);

    const userMessage: Message = {
      id: iso.getTime(),
      text: input,
      sender: "user",
      timestamp: iso,
    };

    const typingMessage: Message = {
      id: iso.getTime() + 1,
      text: "",
      sender: "bot",
      timestamp: iso,
      loading: true,
    };

    setMessages((prev) => [...prev, userMessage, typingMessage]);
    setInput("");

    try {
      const reply = await SendChatBot(input);
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                id: iso.getTime() + 2,
                text: reply,
                sender: "bot",
                timestamp: iso,
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                id: iso.getTime() + 3,
                text: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
                sender: "bot",
                timestamp: iso,
              }
            : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, setMessages]);

  // Allow Enter to send (Shift+Enter for newline)
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="fixed bottom-24 right-6 w-[90vw] sm:w-96 h-125 bg-background rounded-lg shadow-2xl flex flex-col z-50 animate-scale-in">

      {/* Header */}
      <div className="bg-theme p-4 rounded-t-lg">
        <h3 className="font-semibold text-lg text-white">
          مساعد شاورني الذكي - Shwerni AI bot
        </h3>
        <div className="inline-flex items-end gap-2">
          <p className="text-white text-sm opacity-90">نحن هنا للمساعدة</p>
          <Bot className="text-gray-200" />
        </div>
      </div>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="
          group flex items-center justify-between
          px-4 py-2.5 gap-3
          bg-[#0794551a] hover:bg-[#34BE8F]/20
          border-b border-[#34BE8F]/30
          transition-colors duration-200
        "
        dir="rtl"
      >
        {/* right: text */}
        <div className="flex flex-col leading-tight">
          <span className="text-[0.72rem] font-semibold text-[#34BE8F]">
            هل تريد التحدث مع خدمة العملاء؟ 💬
          </span>
          <span className="text-[0.65rem] text-gray-500">
            فريقنا متاح لمساعدتك عبر واتساب الآن
          </span>
        </div>

        {/* left: WhatsApp button */}
        <div
          className="
            flex items-center gap-1.5 shrink-0
            bg-[#34BE8F] hover:bg-[#2aab7e]
            text-white text-[0.7rem] font-semibold
            px-3 py-1.5 rounded-full
            transition-colors duration-150
            group-hover:shadow-md
          "
        >
          {/* WhatsApp SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-3.5 h-3.5 fill-white"
            aria-hidden="true"
          >
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.664 4.797 1.82 6.797L2 30l7.395-1.793A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.43 11.43 0 0 1-5.832-1.594l-.418-.248-4.387 1.063 1.094-4.27-.273-.44A11.46 11.46 0 0 1 4.5 16C4.5 9.596 9.596 4.5 16 4.5S27.5 9.596 27.5 16 22.404 27.5 16 27.5zm6.29-8.562c-.344-.172-2.04-1.006-2.355-1.12-.316-.115-.546-.172-.775.172-.23.344-.89 1.12-1.09 1.35-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.707-1.022-.912-1.713-2.037-1.913-2.381-.2-.344-.021-.53.15-.7.154-.154.344-.4.516-.6.172-.2.23-.344.344-.574.115-.23.058-.43-.029-.602-.086-.172-.775-1.87-1.062-2.561-.28-.672-.563-.58-.775-.59-.2-.01-.43-.012-.66-.012a1.27 1.27 0 0 0-.918.43c-.315.344-1.203 1.176-1.203 2.867s1.232 3.326 1.404 3.555c.172.23 2.425 3.703 5.875 5.192.82.354 1.46.566 1.959.724.822.262 1.571.225 2.162.137.66-.099 2.04-.834 2.328-1.639.287-.805.287-1.494.2-1.639-.086-.143-.315-.23-.66-.4z" />
          </svg>
          واتساب
        </div>
      </a>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 h-60">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك..."
            disabled={isSending}
            className={cn(
              "resize-none min-h-12",
              isSending && "opacity-60 cursor-not-allowed",
            )}
            dir="rtl"
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={isSending}
            className={cn(
              "h-12 w-12 shrink-0 bg-zblue-200",
              isSending && "opacity-60 cursor-not-allowed",
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BotChat;