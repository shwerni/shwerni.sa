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
  label: string;
  copy: string;
  className?: string;
}
const CopyBtn = ({ label, copy, className }: Props) => {
  const [isLabel, setLabel] = React.useState<boolean>();
  const timeout = React.useRef(null);

  // handle copying
  const copyToClipboard = async () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    await navigator.clipboard.writeText(copy);
    // label is clicked
    setLabel(true);
    setTimeout(() => {
      setLabel(false);
      timeout.current = null;
    }, 700);
  };

  return (
    <Button
      onClick={copyToClipboard}
      className={cn(["zgreyBtn", className ?? ""])}
    >
      {isLabel ? (
        <>
          <Check className="px-1" /> تم النسخ
        </>
      ) : (
        <>
          <Copy className="px-1" /> {label}
        </>
      )}
    </Button>
  );
};

export default CopyBtn;
