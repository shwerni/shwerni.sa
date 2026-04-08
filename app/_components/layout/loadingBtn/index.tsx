// React & Next
import React from "react";

// components
import Spinner from "@/app/_components/layout/skeleton/spinners";

interface LoadingBtnProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function LoadingBtn({ loading, children }: LoadingBtnProps) {
  return loading ? (
    <Spinner
      style="stroke-zgrey-50 w-5 h-5"
      title="جاري التحميل"
      tstyle="text-white"
    />
  ) : (
    children
  );
}

