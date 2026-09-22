"use client";

import { useEffect, useState } from "react";

interface Props {
  value: string;
}

const EventFlipDigit = ({ value }: Props) => {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value === current) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrevious(current);
    setCurrent(value);
    setFlipping(true);

    const timeout = setTimeout(() => setFlipping(false), 600);
    return () => clearTimeout(timeout);
  }, [value, current]);

  return (
    <div className="relative w-11 h-14 sm:w-14 sm:h-20 select-none [perspective:500px] drop-shadow-md">
      {/* static top half — always shows the settled digit */}
      <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md bg-theme-900 flex items-end justify-center">
        <span className="text-white text-2xl sm:text-4xl font-bold leading-none translate-y-1/2">
          {current}
        </span>
      </div>

      {/* static bottom half — always shows the settled digit */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md bg-theme-700 flex items-start justify-center">
        <span className="text-white text-2xl sm:text-4xl font-bold leading-none -translate-y-1/2">
          {current}
        </span>
      </div>

      {/* flipping leaves — only mounted during the transition */}
      {flipping && (
        <>
          <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md bg-theme-900 flex items-end justify-center [transform-origin:bottom] [backface-visibility:hidden] animate-flip-top">
            <span className="text-white text-2xl sm:text-4xl font-bold leading-none translate-y-1/2">
              {previous}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md bg-theme-700 flex items-start justify-center [transform-origin:top] [backface-visibility:hidden] animate-flip-bottom">
            <span className="text-white text-2xl sm:text-4xl font-bold leading-none -translate-y-1/2">
              {current}
            </span>
          </div>
        </>
      )}

      <div className="absolute inset-x-0 top-1/2 h-px bg-black/25 z-10" />
    </div>
  );
};

export default EventFlipDigit;
