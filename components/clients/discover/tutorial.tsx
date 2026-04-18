"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

export default function ScrollTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  function dismiss() {
    setIsFadingOut(true);
    // Wait for fade out animation to finish before removing from DOM
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem("shwerni_reel_tutorial", "true");
    }, 300);
  }

  useEffect(() => {
    // Check if the user has seen the tutorial before
    const hasSeen = localStorage.getItem("shwerni_reel_tutorial");

    if (!hasSeen) {
      // Delay showing it slightly to let the Reel component finish sliding in
      const showTimer = setTimeout(() => setIsVisible(true), 600);

      // Auto-hide after 4 seconds if they don't interact
      const hideTimer = setTimeout(() => dismiss(), 4600);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      onClick={dismiss}
      onTouchStart={dismiss}
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
        isFadingOut ? "opacity-0" : "opacity-100",
      )}
    >
      {/* Inline styles for the custom swipe animation */}
      <style>{`
        @keyframes swipeUpFade {
          0% { transform: translateY(40px) scale(0.9); opacity: 0; }
          15% { transform: translateY(40px) scale(1); opacity: 1; }
          70% { transform: translateY(-40px) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.9); opacity: 0; }
        }
        .animate-swipe-up {
          animation: swipeUpFade 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-3 animate-swipe-up">
        <div className="flex flex-col items-center -mb-4 opacity-70">
          <ChevronUp className="w-8 h-8 text-white" strokeWidth={3} />
          <ChevronUp className="w-8 h-8 text-white -mt-5" strokeWidth={3} />
        </div>

        {/* Hand SVG Icon */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-lg"
        >
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M10 4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M16 11V6" />
          <path d="M6 11V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M4 11l4.8 4.8A2 2 0 0 0 10.2 16H15a2 2 0 0 0 2-2v-3" />
        </svg>

        <p className="text-white font-medium text-lg drop-shadow-md mt-2">
          اسحب للأعلى لاستكشاف المزيد
        </p>
      </div>
    </div>
  );
}
