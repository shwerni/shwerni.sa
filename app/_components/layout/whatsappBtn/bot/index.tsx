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

// utils
import { cn } from "@/lib/utils";

// lib
import { SendChatBot } from "@/lib/api/ai/chat-bot";
import { User } from "next-auth";

// linkify
const linkifyOptions = {
  rel: "noopener noreferrer",
  className: "text-blue-600 underline",
};

// types
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  loading?: boolean;
}

interface ChatProps {
  user?: User;
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const BotChat = ({ onClose, setMessages, user, messages }: ChatProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    const typingMessage: Message = {
      id: Date.now() + 1,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      loading: true,
    };

    setMessages((prev) => [...prev, userMessage, typingMessage]);
    setInput("");

    try {
      const reply = await SendChatBot(input, user);

      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                id: Date.now() + 2,
                text: reply,
                sender: "bot",
                timestamp: new Date(),
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                id: Date.now() + 3,
                text: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
                sender: "bot",
                timestamp: new Date(),
              }
            : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed bottom-24 right-6 w-[90vw] sm:w-96 h-[500px] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-50 animate-scale-in"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-zblue-200 p-4 rounded-t-lg">
        <h3 className="font-semibold text-lg text-white">
          shwerni bot - مساعد شاورني الذكي
        </h3>
        <div className="inline-flex items-end gap-2">
          <p className="text-white text-sm opacity-90">نحن هنا للمساعدة</p>
          <Bot className="text-gray-200" />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-fade-in",
                message.sender === "user" ? "justify-end" : "justify-start",
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
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
                      "text-xs text-right leading-4 wrap-break-word",
                      message.sender === "user"
                        ? "text-white"
                        : "text-gray-800",
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
