"use client";
// React & Next
import React from "react";
import { useRouter } from "next/navigation";

// icons
import { ArrowLeft, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

// props
interface Props {
  type: "link" | "function";
  label?: string;
  link?: string;
  onBack?: () => void;
  dir?: "rtl" | "ltr";
  className?: string;
}

const BackButton: React.FC<Props> = ({
  type,
  label,
  onBack,
  link,
  dir,
  className,
}) => {
  // router
  const router = useRouter();

  const handleClick = () => {
    if (type === "function" && onBack) {
      onBack();
    } else if (type === "link" && link) {
      router.push(link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn([
        "flex items-end justify-end cursor-pointer",
        className ?? "",
      ])}
      dir={dir ?? "rtl"}
    >
      <div className="rflex gap-2">
        <h3 className="text-base">{label ?? "رجوع"}</h3>
        <ArrowLeft className="h-4 w-4 mr-2" />
      </div>
    </div>
  );
};

export default BackButton;
