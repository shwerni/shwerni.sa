"use client";
// React & Next
import React, { useEffect, useRef, useState } from "react";

// same fade-in as the old motion/react version, in css: the server renders the start
// styles (hidden until in view, as motion did), then a css transition runs to the end
// styles once the element is 100px inside the viewport, one time only

type FadeVariant =
  | "fade"
  | "from-bottom"
  | "from-top"
  | "from-left"
  | "from-right"
  | "scale-in"
  | "blur-in";

interface FadeInOnScrollProps {
  children: React.ReactNode;
  variant?: FadeVariant;
  duration?: number;
  delay?: number;
  className?: string;
}

// same values as the motion variants: x/y in px, scale, blur
const variantsMap: Record<
  FadeVariant,
  { initial: React.CSSProperties; animate: React.CSSProperties }
> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },

  "from-bottom": {
    initial: { opacity: 0, transform: "translateY(30px)" },
    animate: { opacity: 1, transform: "none" },
  },

  "from-top": {
    initial: { opacity: 0, transform: "translateY(-30px)" },
    animate: { opacity: 1, transform: "none" },
  },

  "from-left": {
    initial: { opacity: 0, transform: "translateX(-30px)" },
    animate: { opacity: 1, transform: "none" },
  },

  "from-right": {
    initial: { opacity: 0, transform: "translateX(30px)" },
    animate: { opacity: 1, transform: "none" },
  },

  // appears "from nowhere"
  "scale-in": {
    initial: { opacity: 0, transform: "scale(0.96)" },
    animate: { opacity: 1, transform: "none" },
  },

  // premium UI feel
  "blur-in": {
    initial: { opacity: 0, filter: "blur(8px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
  },
};

// motion's ease [0.22, 1, 0.36, 1]
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function DivMotion({
  children,
  variant = "from-bottom",
  duration = 2.5,
  delay = 0,
  className,
}: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // motion's whileInView with viewport { once: true, margin: "-100px" }
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin: "-100px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const selected = variantsMap[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(inView ? selected.animate : selected.initial),
        transitionProperty: "opacity, transform, filter",
        transitionDuration: `${duration}s`,
        transitionTimingFunction: EASE,
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
