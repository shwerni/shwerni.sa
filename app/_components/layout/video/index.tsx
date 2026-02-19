"use client";
// React & Next
import React from "react";

// source
const source = "/video/";

// video
export const MotionGraphicPlayer: React.FC = () => {
  return (
    <div>
      <video
        src={source}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};
