"use client";

// react & next
import React from "react";
import Image from "next/image";

// packages
import * as motion from "motion/react-client";

// components
import BotChat from ".";
import { Button } from "@/components/ui/button";

// lib
import { timeZone } from "@/lib/site/time";

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
  // timezone
  const { iso } = timeZone();

  // states
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      text: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
      sender: "bot",
      timestamp: iso,
    },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="fixed bottom-2 right-0 sm:bottom-3 sm:right-3 flex items-center justify-center w-24 z-50"
    >
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 h-14 w-14 bg-zblue-200 p-0 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-50 overflow-hidden flex items-center justify-center"
      >
        {isOpen ? (
          <X className="h-7 w-7 text-white" />
        ) : (
          // "say hi" wave and bounce animation
          <motion.div
            animate={{
              y: [0, -4, 0],
              rotate: [0, 15, -10, 15, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 3, 
              ease: "easeInOut",
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <Image
              alt="bot"
              src="/svg/bot.svg"
              width={512}
              height={512}
              className="w-full h-full object-cover p-1"
            />
          </motion.div>
        )}
      </Button>

      {isOpen && (
        <BotChat
          onClose={() => setIsOpen(false)}
          messages={messages}
          setMessages={setMessages}
        />
      )}
    </motion.div>
  );
};

export default ChatButton;