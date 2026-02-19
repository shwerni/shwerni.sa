"use client";
// React & Next
import React from "react";
import Image from "next/image";

// components
import BotChat from ".";
import { Button } from "@/components/ui/button";

// icons
import { X } from "lucide-react";

// types
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  loading?: boolean;
}

const ChatButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: Date.now(),
      text: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 h-14 w-14 bg-zblue-200 p-0 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-50"
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <Image
            alt="bot"
            src="/svg/bot.svg"
            width={512}
            height={512}
            className="w-full h-full object-cover"
          />
        )}
      </Button>

      {isOpen && (
        <BotChat
          onClose={() => setIsOpen(false)}
          messages={messages}
          setMessages={setMessages}
        />
      )}
    </>
  );
};

export default ChatButton;
