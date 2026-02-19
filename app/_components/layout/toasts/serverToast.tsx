"use client";
// React & Next
import React from "react";

// components
import { ZToast } from "@/app/_components/layout/toasts";

interface Props {
  children: React.JSX.Element;
  message: string;
  state: boolean;
}
export default function ServerToast({ children, message, state }: Props) {
  // toast
  React.useEffect(() => {
    // toast
    ZToast({ state: false, message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return the error page
  return children;
}
