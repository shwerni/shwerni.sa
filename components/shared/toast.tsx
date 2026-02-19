"use client";
import React from "react";
import { toast as sonnerToast } from "sonner";
import {
  X,
  AlertTriangle,
  Info,
  CheckIcon,
  CircleQuestionMarkIcon,
} from "lucide-react";

type ToastParams = {
  title?: string;
  message?: string;
  description?: string;
  duration?: number;
};

// type
const icons: Record<
  "success" | "error" | "info" | "warning",
  React.ElementType
> = {
  success: CheckIcon,
  error: CircleQuestionMarkIcon,
  info: Info,
  warning: AlertTriangle,
};

// default titles
const defaultTitles: Record<"success" | "error" | "info" | "warning", string> =
  {
    success: "تم بنجاح",
    error: "خطأ",
    info: "معلومة",
    warning: "تحذير",
  };

// type
const colors: Record<
  "success" | "error" | "info" | "warning",
  { color: string; bg100: string; bg50: string; bg700: string; text: string }
> = {
  success: {
    color: "green",
    bg100: "bg-green-100",
    bg50: "bg-green-50",
    bg700: "bg-green-700",
    text: "text-green-700",
  },
  error: {
    color: "red",
    bg100: "bg-red-100",
    bg50: "bg-red-50",
    bg700: "bg-red-700",
    text: "text-red-700",
  },
  info: {
    color: "blue",
    bg100: "bg-blue-100",
    bg50: "bg-blue-50",
    bg700: "bg-blue-700",
    text: "text-blue-700",
  },
  warning: {
    color: "amber",
    bg100: "bg-amber-100",
    bg50: "bg-amber-50",
    bg700: "bg-amber-700",
    text: "text-amber-700",
  },
};

const createToast = (type: "success" | "error" | "info" | "warning") => {
  return ({ title, message, description, duration }: ToastParams) => {
    const Icon = icons[type];
    const color = colors[type];
    const Title = title ?? defaultTitles[type];

    sonnerToast(
      <div
        className={`flex w-full overflow-hidden border ${color.bg50} rounded-lg`}
      >
        {/* side bar */}
        <div className={`${color.bg700} w-2`} />

        {/* content */}
        <div className="flex-1 flex items-center gap-3 p-4">
          <div
            className={`flex items-center  bg-${color.color}-100 p-3 rounded-full`}
          >
            <Icon className={`w-5 h-5  ${color.text}`} />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            {/* title  */}
            <h3 className={`${color.text} font-bold text-sm`}>{Title}</h3>

            {/* optional message */}
            {message && <p className="text-sm text-black">{message}</p>}

            {/* optional description */}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <X
            className="ml-auto w-5 h-5 cursor-pointer"
            onClick={() => sonnerToast.dismiss()}
          />
        </div>
      </div>,
      {
        style: { padding: 0 },
        duration: duration ?? 1700,
      },
    );
  };
};

export const toast = {
  success: createToast("success"),
  error: createToast("error"),
  info: createToast("info"),
  warning: createToast("warning"),
};
