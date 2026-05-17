// components
import { cn } from "@/lib/utils";
import FilePreview from "./file-preview";

// schema
import { MeetingMessage } from "@/schemas/chat";

// format time
const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

interface MessageBubbleProps {
  msg: MeetingMessage;
  isOwn: boolean;
}

export default function MessageBubble({ msg, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] sm:max-w-[65%] px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base",
          isOwn
            ? "bg-theme text-white rounded-br-none"
            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none",
        )}
      >
        {msg.content && (
          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        )}
        {msg.fileUrl && (
          <FilePreview
            fileUrl={msg.fileUrl}
            fileType={msg.fileType}
            fileName={msg.fileName}
            isOwn={isOwn}
          />
        )}
      </div>
      <span className="text-xs text-slate-400 mt-1 px-1">
        {formatTime(msg.createdAt)}
      </span>
    </div>
  );
}
