"use client";
// React & Next
import Image from "next/image";
import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
// components
import { Button } from "@/components/ui/button";

// lib
import { timeZone } from "@/lib/site/time";

const BotChat = lazy(() => import("."));

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  loading?: boolean;
}

const GREETINGS = [
  "مرحباً! أنا مساعد شاورني الذكي 👋",
  "هل تحتاج مساعدة نفسية أو استشارة؟ 💙",
  "أنا هنا للإجابة على أسئلتك 24/7 ✨",
  "تحدث معي، أنا مساعد شاورني الذكي 🤖",
];

const BUBBLE_VISIBLE_MS = 3500;
const BUBBLE_GAP_MS = 5700;

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
  const [isFlipped, setIsFlipped] = React.useState(false);
  const flipRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [greetingIndex, setGreetingIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleToggle = () => {
    if (!hasMounted) setHasMounted(true);
    setIsOpen((prev) => !prev);
  };

  const scheduleCycle = useCallback((index: number) => {
    setGreetingIndex(index);
    setShowBubble(true);

    timerRef.current = setTimeout(() => {
      setShowBubble(false);

      timerRef.current = setTimeout(() => {
        scheduleCycle((index + 1) % GREETINGS.length);
      }, BUBBLE_GAP_MS);
    }, BUBBLE_VISIBLE_MS);
    // scheduleCycle is stable — deps intentionally empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      clearTimer();
      setShowBubble(false);
      return;
    }

    timerRef.current = setTimeout(() => scheduleCycle(0), 1500);

    return clearTimer;
  }, [isOpen, scheduleCycle]);

  useEffect(() => {
    flipRef.current = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 3700);

    return () => {
      if (flipRef.current) clearInterval(flipRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-2 right-0 sm:bottom-3 sm:right-3 z-50">
      <div
        aria-live="polite"
        className={`
          absolute bottom-16 right-1 sm:right-0 w-56
          transition-all duration-300 ease-out     pointer-events-none

          ${
            showBubble
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none"
          }
        `}
      >
        {/* bubble card */}
        <div
          className="
            relative cursor-pointer
            bg-white border border-gray-100
            rounded-2xl rounded-br-sm
            px-4 py-2.5 shadow-lg
            text-sm text-right font-medium text-gray-700
            leading-relaxed select-none
          "
        >
          {/* brand accent bar */}
          <span className="absolute top-0 right-0 w-1 h-full bg-[#094577] rounded-r-2xl" />

          <p>{GREETINGS[greetingIndex]}</p>

          {/* sub-label */}
          <p className="text-[0.65rem] text-gray-400 mt-0.5">
            مساعد شاورني الذكي · اضغط للمحادثة
          </p>
        </div>

        {/* bubble tail */}
        <div className="w-3 h-3 bg-white border-b border-l border-gray-100 -rotate-45 absolute -bottom-1.5 right-4 shadow-sm" />
      </div>

      <Button
        onClick={handleToggle}
        aria-label={isOpen ? "إغلاق المحادثة" : "فتح المحادثة"}
        variant="primary"
        className="fixed bottom-4 right-4 h-14 w-14 p-0 rounded-full shadow-lg z-50 flex items-center justify-center"
        style={{
          background: isFlipped ? "#25D366" : undefined,
          transition: "background 0.4s ease",
          perspective: "600px",
          overflow: "visible",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front — bot svg */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
            className="animate-bot-wave"
          >
            <Image
              alt="bot"
              src="/svg/bot.svg"
              width={48}
              height={48}
              className="w-full h-full object-cover p-1"
              priority={false}
            />
          </div>

          {/* Back — WhatsApp icon */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
        </div>
      </Button>

      {hasMounted && (
        <div
          style={{
            visibility: isOpen ? "visible" : "hidden",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 200ms, transform 200ms, visibility 200ms",
            pointerEvents: isOpen ? "auto" : "none",
          }}
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
