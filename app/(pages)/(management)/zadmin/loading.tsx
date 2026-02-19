// React & Next
import React from "react";

// components
import { SpinnerEn } from "@/app/_components/layout/skeleton/spinners";

export default function Loading() {
  return (
    <div className="min-w-full min-h-screen cflex">
      <SpinnerEn />
    </div>
  );
}
