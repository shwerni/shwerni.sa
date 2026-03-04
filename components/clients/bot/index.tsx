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
