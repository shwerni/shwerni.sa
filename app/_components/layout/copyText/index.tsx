"use client";
// React & Next
import React from "react";

// components
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { ZToast } from "@/app/_components/layout/toasts";

// icons
import { Check, Copy } from "lucide-react";

// props
interface Props {
  text: string;
  title?: string;
  hide?: boolean;
  style?: string;
  dir?: "rtl" | "ltr";
}
// return
export default function CopyText({ text, title, hide, style, dir }: Props) {
  // copy link
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    ZToast({ state: true, message: "تم نسخ الرابط" });
  };
  return (
    <HoverCard>
      <HoverCardTrigger>
        <h5 onClick={() => copy(text)} className={`${style} break-all`}>
          {hide ? title : text}
        </h5>
      </HoverCardTrigger>
      <HoverCardContent dir={dir}>
        <div className="space-y-3">
          <h3 className="break-all text-base font-bold">{text}</h3>
          <h6>اضغط علي الرابط للنسخ</h6>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// admin copy text - english
export const CopyTextEn = (props: { label?: string; text: string }) => {
  const [label, setLabel] = React.useState<boolean>();
  const timeout = React.useRef(null);

  // handle copying
  const copyToClipboard = async () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    await navigator.clipboard.writeText(props.text);
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
      variant="secondary"
      className="bg-transparent"
      type="button"
    >
      {label ? (
        <>
          <Check className="w-6 px-1" /> coppied!
        </>
      ) : (
        <>
          {props.label && props.label}
          <Copy className="w-6 px-1" />
        </>
      )}
    </Button>
  );
};
