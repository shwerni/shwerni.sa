// components
import { Button } from "@/components/ui/button";

// icons
import { FileText, X } from "lucide-react";

// is image
const isImage = (type: string) => type.startsWith("image/");

interface Props {
  file: File;
  onRemove: () => void;
}

export default function AttachmentPreview({ file, onRemove }: Props) {
  const preview = isImage(file.type) ? URL.createObjectURL(file) : null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-sm text-slate-700 border border-slate-200">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="w-8 h-8 rounded object-cover shrink-0"
        />
      ) : (
        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
      )}
      <span className="max-w-35 truncate">{file.name}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="ml-1 h-5 w-5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
