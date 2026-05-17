// icons
import { cn } from "@/lib/utils";
import { FileText, Download } from "lucide-react";

// check if image
const isImage = (fileType: string | null) =>
  fileType?.startsWith("image/") ?? false;

interface Props {
  fileUrl: string;
  fileType: string | null;
  fileName: string | null;
  isOwn: boolean;
}

export default function FilePreview({
  fileUrl,
  fileType,
  fileName,
  isOwn,
}: Props) {
  if (isImage(fileType)) {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
        <div className="relative mt-2 rounded-xl overflow-hidden max-w-65">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={fileName ?? "image"}
            className="w-full h-auto max-h-48 object-cover"
          />
        </div>
      </a>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isOwn
          ? "bg-white/20 text-white hover:bg-white/30"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
      )}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-45">{fileName ?? "ملف"}</span>
      <Download className="w-4 h-4 shrink-0 ml-auto" />
    </a>
  );
}
