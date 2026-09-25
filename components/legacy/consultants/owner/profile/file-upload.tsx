"use client";
// React & Next
import React from "react";
import Image from "next/image";

// packages
import { useFormContext } from "react-hook-form";

// css
import "@/styles/upload-thing.css";

// components
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ZToast } from "@/components/legacy/layout/toasts";

// lib
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/upload";

// prisma data
import { saveUploadedFile, saveUploadedImage } from "@/data/uploads";

// schema
import { type DocumentField, type ProfileFormValues } from "@/schemas/consultant/profile";

// icons
import { ExternalLink, FileCheck2, Trash2 } from "lucide-react";

// props
interface Props {
  name: DocumentField;
  kind: "image" | "pdf";
  label: string;
  description: string;
  required: boolean;
  author: string;
  disabled: boolean;
  onUploadingChange: (name: DocumentField, uploading: boolean) => void;
}

// single upload slot whose value (file url) lives in the form
export function FileUploadField({
  name,
  kind,
  label,
  description,
  required,
  author,
  disabled,
  onUploadingChange,
}: Props) {
  const { control } = useFormContext<ProfileFormValues>();
  const [uploading, setUploading] = React.useState(false);

  // keep local + parent (submit button) upload state in sync
  const setUploadingState = (value: boolean) => {
    setUploading(value);
    onUploadingChange(name, value);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-4 transition-colors",
            fieldState.error
              ? "border-red-300 bg-red-50/40"
              : "border-zgrey-50",
          )}
        >
          {/* label + requirement */}
          <div className="flex items-center justify-between gap-2">
            <FormLabel>{label}</FormLabel>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                required
                  ? "bg-red-50 text-red-600"
                  : "bg-zgrey-50 text-muted-foreground",
              )}
            >
              {required ? "إجباري" : "اختياري"}
            </span>
          </div>
          <FormDescription className="text-xs">{description}</FormDescription>

          <FormControl>
            {/* focusable target so validation errors scroll here */}
            <div ref={field.ref} tabIndex={-1} className="outline-none">
              {field.value ? (
                <div className="flex items-center justify-between gap-3">
                  {kind === "image" ? (
                    <Image
                      src={field.value}
                      alt={label}
                      width={128}
                      height={128}
                      className="w-16 h-16 rounded-full object-cover object-top border-2 border-zgrey-50"
                    />
                  ) : (
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-zblue-200 hover:underline"
                    >
                      <FileCheck2 className="w-5 h-5 text-green-600" />
                      تم رفع الملف
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    onClick={() => field.onChange("")}
                    aria-label={`حذف ${label}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <UploadButton
                  className="upload-thing"
                  disabled={disabled || uploading}
                  endpoint={kind === "image" ? "imageUploader" : "pdfUploader"}
                  onUploadBegin={() => setUploadingState(true)}
                  onClientUploadComplete={async (res) => {
                    const file = res[0];
                    setUploadingState(false);
                    if (!file) return;
                    // value change also clears this field's error after a failed submit
                    field.onChange(file.ufsUrl);
                    // record upload in db
                    if (kind === "image") {
                      await saveUploadedImage(file.key, author, file.ufsUrl);
                    } else {
                      await saveUploadedFile(file.key, author, file.ufsUrl);
                    }
                  }}
                  onUploadError={() => {
                    setUploadingState(false);
                    ZToast({
                      state: false,
                      message: `تعذر رفع ${label}، حاول مرة أخرى`,
                    });
                  }}
                />
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
