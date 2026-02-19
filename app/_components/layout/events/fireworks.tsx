// React & Next
import React from "react";

// packages
import { Fireworks } from "fireworks-js";

// props
interface Props {
  duration?: number;
}

export default function FireworksDiv({ duration = 17000 }: Props) {
  const fireworksRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!fireworksRef.current) return;

    const fireworks = new Fireworks(fireworksRef.current, {
      autoresize: true,
      opacity: 0.5,
      acceleration: 1.05,
      friction: 0.97,
      gravity: 1.5,
      particles: 50,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 5,
      intensity: 30,
      flickering: 50,
      lineStyle: "round",
      hue: { min: 0, max: 360 },
      delay: { min: 30, max: 60 },
      rocketsPoint: { min: 50, max: 50 },
    });

    fireworks.start();

    // ⏱ stop after 17s
    const timer = setTimeout(() => {
      fireworks.stop();
    }, duration);

    return () => {
      clearTimeout(timer);
      fireworks.stop();
    };
  }, []);

  return (
    <div
      ref={fireworksRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}
