// React & Next
import React from "react";

// packages
import * as motion from "motion/react-client";

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

const variantsMap = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },

  "from-bottom": {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  },

  "from-top": {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
  },

  "from-left": {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
  },

  "from-right": {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
  },

  // appears "from nowhere"
  "scale-in": {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
  },

  // premium UI feel
  "blur-in": {
    initial: { opacity: 0, filter: "blur(8px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
  },
};

export default function DivMotion({
  children,
  variant = "from-bottom",
  duration = 2.5,
  delay = 0,
  className,
}: FadeInOnScrollProps) {
  const selected = variantsMap[variant];

  return (
    <motion.div
      initial={selected.initial}
      whileInView={selected.animate}
      viewport={{
        once: true,
        margin: "-100px",
      }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
