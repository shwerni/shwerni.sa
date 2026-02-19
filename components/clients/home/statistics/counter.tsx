"use client";
// React & Next
import React from "react";

// props
interface Props {
  value: number;
  delay?: number;
  duration?: number;
}

export const Counter = ({ value, delay = 0, duration = 2000 }: Props) => {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLHeadingElement | null>(null);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;

        started.current = true;

        let start: number | null = null;

        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = timestamp - start;
          const current = Math.min(
            Math.round((progress / duration) * value),
            value,
          );
          setCount(current);
          if (progress < duration) requestAnimationFrame(step);
        };

        setTimeout(() => {
          requestAnimationFrame(step);
        }, delay);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [value, delay, duration]);

  return (
    <h5 className="text-[#117ED8] font-semibold text-2xl sm:text-4xl" ref={ref}>
      {count.toLocaleString()}+
    </h5>
  );
};
