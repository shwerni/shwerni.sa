"use client";
// React & Next
import React from "react";

// components
import { Button } from "@/components/ui/button";

// utils
import { cn } from "@/lib/utils";

// icons
import { Check, Copy } from "lucide-react";

// props
interface Props {
  label?: string;
  variant?: "transparent" | "default";
  className?: string;
  iconClassName?: string;
  size?: "sm" | "default" | "lg";
  value: string | number;
  hideLabel?: boolean;
}

const CopyButton = ({
  label,
  variant = "default",
  className,
  size = "default",
  value,
  iconClassName,
  hideLabel = false,
}: Props) => {
  const [copied, setCopied] = React.useState<boolean>(false);
  const timeout = React.useRef(null);

  // handle copying
  const copyToClipboard = async () => {
    // clear time out
    if (timeout.current) clearTimeout(timeout.current);

    // copy to clipboard
    await navigator.clipboard.writeText(String(value));

    // button is clicked
    setCopied(true);

    // transistion timeout
    setTimeout(() => {
      setCopied(false);
      timeout.current = null;
    }, 700);
  };

  return (
    <Button
      onClick={copyToClipboard}
      variant={variant === "transparent" ? "ghost" : "secondary"}
      className={cn("gap-2", className)}
      size={size}
    >
      {copied ? (
        <>
          <Check className={cn(iconClassName, "w-10 h-10")} /> {!hideLabel && "تم النسخ"}
        </>
      ) : (
        <>
          <Copy className={cn(iconClassName, "w-10 h-10")} /> {!hideLabel && (label || "نسخ")}
        </>
      )}
    </Button>
  );
};

export default CopyButton;
