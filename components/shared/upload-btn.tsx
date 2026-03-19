/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { Control, FieldValues, Path, useController, useFormContext } from "react-hook-form";
import { toast } from "./toast";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/upload";
import { CheckCircle2, FileText, ImageIcon, Loader2, X } from "lucide-react";

const TYPE_CONFIG = {
  image: { endpoint: "imageUploader", accept: "image" as const },
  pdf:   { endpoint: "pdfUploader",   accept: "pdf"   as const },
} satisfies Record<string, { endpoint: string; accept: "image" | "pdf" }>;

type UploadType = keyof typeof TYPE_CONFIG;


interface UploadedFile {
  key: string;
  url: string;
  name: string;
}

interface UploadFieldProps<T extends FieldValues> {
  name: Path<T>;
  type: UploadType;
  control?: Control<T>;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  previewUrl?: string;
  successMessage?: string;
  errorMessage?: string;
  onUploadComplete?: (file: UploadedFile) => void | Promise<void>;
  onUploadError?: (error: Error) => void;
}


export function UploadField<T extends FieldValues>({
  name,
  type,
  control,
  label,
  hint,
  className,
  disabled = false,
  showPreview = true,
  previewUrl: initialPreview,
  successMessage = "تم الرفع بنجاح ✅",
  errorMessage = "حدث خطأ أثناء الرفع ❌",
  onUploadComplete,
  onUploadError,
}: UploadFieldProps<T>) {
  const { endpoint, accept } = TYPE_CONFIG[type];

  // always call both hooks unconditionally
  const ctx = useFormContext<T>();
  const { field, fieldState } = useController({
    name,
    control: control ?? ctx?.control,
  });

  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(initialPreview ?? null);
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile | null>(null);
  const [done, setDone] = React.useState(!!initialPreview);

  const isPdf = accept === "pdf";
  const isDisabled = disabled || uploading;

  function clearUpload() {
    setPreview(null);
    setUploadedFile(null);
    setDone(false);
    field.onChange(null);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Upload zone */}
      <div
        className={cn(
          "relative flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 transition-colors",
          done
            ? "border-green-400 bg-green-50 dark:bg-green-950/20"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900/30",
          isDisabled && "pointer-events-none opacity-60",
          fieldState.error && "border-red-400 bg-red-50 dark:bg-red-950/20",
        )}
      >
        {/* Clear button */}
        {done && !uploading && (
          <button
            type="button"
            onClick={clearUpload}
            className="absolute right-2 top-2 rounded-full p-0.5 text-gray-400 transition-colors hover:text-red-500"
          >
            <X size={16} />
          </button>
        )}

        {/* Uploading spinner */}
        {uploading && (
          <Loader2 size={28} className="animate-spin text-blue-500" />
        )}

        {/* Done state */}
        {done && !uploading && (
          <>
            <CheckCircle2 size={28} className="text-green-500" />

            {/* Image preview */}
            {showPreview && preview && !isPdf && (
              <img
                src={preview}
                alt="preview"
                className="max-h-28 rounded-lg object-contain shadow-sm"
              />
            )}

            {/* PDF preview */}
            {showPreview && isPdf && uploadedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText size={24} className="shrink-0 text-red-500" />
                <span className="max-w-[200px] truncate">{uploadedFile.name}</span>
              </div>
            )}
          </>
        )}

        {/* Upload trigger */}
        {!done && !uploading && (
          <div className="flex flex-col items-center gap-2">
            {accept === "image" && <ImageIcon size={24} className="text-gray-400" />}
            {accept === "pdf"   && <FileText  size={24} className="text-gray-400" />}

            <UploadButton
              className="upload-thing"
              endpoint={endpoint as any}
              disabled={isDisabled}
              onUploadBegin={() => {
                setUploading(true);
                setDone(false);
              }}
              onClientUploadComplete={async (res) => {
                const file = res[0];
                const uploaded: UploadedFile = {
                  key: file.key,
                  url: file.ufsUrl,
                  name: file.name,
                };

                setUploadedFile(uploaded);
                setPreview(file.ufsUrl);
                setUploading(false);
                setDone(true);

                field.onChange(file.ufsUrl);   // ← updates RHF + triggers validation

                toast.success({ message: successMessage });
                await onUploadComplete?.(uploaded);
              }}
              onUploadError={(err) => {
                setUploading(false);
                toast.error({ message: errorMessage });
                onUploadError?.(err);
              }}
            />

            {hint && <p className="text-xs text-gray-400">{hint}</p>}
          </div>
        )}
      </div>

      {/* Validation error */}
      {fieldState.error && (
        <p className="text-xs text-red-500">{fieldState.error.message}</p>
      )}
    </div>
  );
}