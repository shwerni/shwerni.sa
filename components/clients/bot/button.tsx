"use client";
// React & Next
import Image from "next/image";
import React, { lazy, Suspense } from "react";
// components
import { Button } from "@/components/ui/button";

// lib
import { timeZone } from "@/lib/site/time";

// icons
import { X } from "lucide-react";

const BotChat = lazy(() => import("."));

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  loading?: boolean;
}

const ChatButton = () => {
  const { iso } = timeZone();
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      text: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
      sender: "bot",
      timestamp: iso,
    },
  ]);

  const handleToggle = () => {
    if (!hasMounted) setHasMounted(true);
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-2 right-0 sm:bottom-3 sm:right-3 z-50">
      <Button
        onClick={handleToggle}
        aria-label={isOpen ? "إغلاق المحادثة" : "فتح المحادثة"}
        variant="primary"
        className="fixed bottom-4 right-4 h-14 w-14 p-0 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-50 overflow-hidden flex items-center justify-center"
      >
        {isOpen ? (
          <X className="h-7 w-7 text-white" />
        ) : (
          <div className="w-full h-full flex items-center justify-center animate-bot-wave">
            <Image
              alt="bot"
              src="/svg/bot.svg"
              width={48}
              height={48}
              className="w-full h-full object-cover p-1"
              priority={false}
            />
          </div>
        )}
      </Button>

      {hasMounted && (
        <div
          className={
            isOpen
              ? "pointer-events-auto opacity-100 translate-y-0 transition-all duration-200"
              : "pointer-events-none opacity-0 translate-y-2 transition-all duration-150"
          }
        >
          <Suspense fallback={null}>
            <BotChat
              onClose={() => setIsOpen(false)}
              messages={messages}
              setMessages={setMessages}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default ChatButton;
