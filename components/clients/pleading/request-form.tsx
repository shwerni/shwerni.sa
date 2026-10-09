"use client";
// React & Next
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// packages
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";

// uploadthing
import { useUploadThing } from "@/lib/upload";

// components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PhoneInput from "@/components/shared/phone-input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

// actions
import { finalizePleadingRequest, requestPleading } from "@/actions/pleading";

// utils
import { baseActionErrors, networkError } from "@/utils/action-errors";
import {
  DOCX_MIME,
  PLEADING_FILE_ACCEPT,
  PLEADING_MAX_FILES,
  pleadingErrors,
  pleadingRequestSchema,
  type PleadingFile,
} from "@/utils/pleading";

// icons
import {
  CircleAlert,
  FileText,
  Loader2,
  Paperclip,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";

type FormValues = { name: string; phone: string; brief: string };

// an attached file, and its uploaded copy once it's up (so a retry doesn't upload it again)
type Attachment = { file: File; uploaded?: PleadingFile };

const errorMessages: Record<string, string> = {
  ...baseActionErrors,
  ...pleadingErrors,
};

const MB = 1024 * 1024;

// the endpoint's limits: images 8MB, pdf and word 16MB
const fileProblem = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isDoc =
    file.type === "application/pdf" ||
    file.type === DOCX_MIME ||
    /\.docx$/i.test(file.name);
  if (!isImage && !isDoc) return "يُسمح بالصور وملفات PDF و Word (docx) فقط";
  if (isImage && file.size > 8 * MB) return "حجم الصورة يتجاوز 8 ميجابايت";
  if (file.size > 16 * MB) return "حجم الملف يتجاوز 16 ميجابايت";
  return null;
};

// the request form: name, phone, the brief (the case chat's first message) and up to 5 files.
// requestPleading saves the brief, the files upload with the returned link token, then
// finalizePleadingRequest sends the case to the consultant and the client goes to their case page
export function PleadingRequestForm({ cid }: { cid: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  // the saved draft: after it exists, a retry only finishes the uploads
  const [draft, setDraft] = useState<{ plid: number; token: string } | null>(
    null,
  );
  const [stage, setStage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, register, handleSubmit, setError, clearErrors, formState } =
    useForm<FormValues>({ defaultValues: { name: "", phone: "", brief: "" } });

  const { startUpload } = useUploadThing("pleadingAttachment");

  const addFiles = (list: FileList | null) => {
    setFileError(null);
    if (!list) return;

    const next = [...attachments];
    for (const file of Array.from(list)) {
      if (next.length >= PLEADING_MAX_FILES) {
        setFileError(`يمكنك إرفاق ${PLEADING_MAX_FILES} ملفات كحد أقصى`);
        break;
      }
      const problem = fileProblem(file);
      if (problem) {
        setFileError(`${file.name}: ${problem}`);
        continue;
      }
      next.push({ file });
    }
    setAttachments(next);
  };

  const removeFile = (index: number) =>
    setAttachments((list) => list.filter((_, i) => i !== index));

  function onSubmit(values: FormValues) {
    // the same schema the action checks on the server, for inline messages
    const parsed = pleadingRequestSchema.safeParse({ cid, ...values });
    clearErrors();
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" || key === "phone" || key === "brief")
          setError(key, { message: issue.message });
      }
      return;
    }

    startTransition(async () => {
      try {
        // 1. the draft and the brief (once)
        let current = draft;
        if (!current) {
          setStage("جاري حفظ الطلب...");
          const result = await requestPleading(parsed.data);
          if (!result.ok) {
            toast.error(errorMessages[result.error] ?? errorMessages.server_error);
            return;
          }
          current = result.data;
          setDraft(current);
        }

        // 2. the files, one by one; one that fails stops here, the others stay uploaded
        const files: PleadingFile[] = [];
        for (let i = 0; i < attachments.length; i++) {
          const item = attachments[i];
          if (item.uploaded) {
            files.push(item.uploaded);
            continue;
          }
          setStage(`جاري رفع الملفات (${i + 1}/${attachments.length})...`);
          const uploaded = await startUpload([item.file], {
            plid: current.plid,
            token: current.token,
          }).catch(() => undefined);
          if (!uploaded?.length) {
            toast.error(
              `تعذر رفع الملف «${item.file.name}». تأكد من اتصالك وحجم الملف ثم أعد المحاولة، أو احذف الملف وأرسل الطلب بدونه.`,
            );
            return;
          }
          const done: PleadingFile = {
            url: uploaded[0].ufsUrl,
            name: item.file.name,
            type: item.file.type || DOCX_MIME,
          };
          files.push(done);
          setAttachments((list) =>
            list.map((a) => (a.file === item.file ? { ...a, uploaded: done } : a)),
          );
        }

        // 3. send the case to the consultant
        setStage("جاري إرسال الطلب...");
        const result = await finalizePleadingRequest({
          token: current.token,
          files,
        });
        if (!result.ok) {
          toast.error(errorMessages[result.error] ?? errorMessages.server_error);
          return;
        }

        toast.success("تم إرسال طلبك إلى المستشار");
        router.replace(`/pleading/q/${current.token}`);
      } catch {
        toast.error(networkError);
      } finally {
        setStage(null);
      }
    });
  }

  const err = (k: keyof FormValues) => formState.errors[k]?.message;
  const locked = isPending || !!draft;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6"
      dir="rtl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* name */}
        <Field data-invalid={!!err("name")}>
          <FieldLabel htmlFor="pleading-name">
            <span className="text-red-700 font-medium">* </span>الاسم
          </FieldLabel>
          <Input
            id="pleading-name"
            placeholder="اكتب اسمك"
            disabled={locked}
            {...register("name")}
          />
          {err("name") && <FieldError errors={[{ message: err("name") }]} />}
        </Field>

        {/* phone */}
        <div className="space-y-2">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Field data-invalid={!!err("phone")}>
                <FieldLabel htmlFor="pleading-phone">
                  <span className="text-red-700 font-medium">* </span>رقم
                  الهاتف
                </FieldLabel>
                <div dir="ltr">
                  <PhoneInput
                    {...field}
                    id="pleading-phone"
                    disabled={locked}
                    placeholder="50000000"
                  />
                </div>
                {err("phone") && (
                  <FieldError errors={[{ message: err("phone") }]} />
                )}
              </Field>
            )}
          />
          <div className="inline-flex items-center gap-1.5">
            <CircleAlert className="w-4 text-gray-800" />
            <p className="text-xs text-gray-800">يجب أن يكون مربوط بالواتس اب</p>
          </div>
        </div>
      </div>

      {/* brief */}
      <Field data-invalid={!!err("brief")}>
        <FieldLabel htmlFor="pleading-brief">
          <span className="text-red-700 font-medium">* </span>ملخص القضية
        </FieldLabel>
        <Textarea
          id="pleading-brief"
          rows={8}
          maxLength={4000}
          placeholder="اشرح قضيتك: الأطراف، ما حدث، وما تريد الوصول إليه"
          disabled={locked}
          {...register("brief")}
        />
        {err("brief") && <FieldError errors={[{ message: err("brief") }]} />}
      </Field>

      {/* files */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            المستندات (اختياري، حتى {PLEADING_MAX_FILES} ملفات)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || attachments.length >= PLEADING_MAX_FILES}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
            إرفاق ملف
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={PLEADING_FILE_ACCEPT}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-xs text-gray-500">
          صور (حتى 8 ميجابايت)، أو PDF و Word (حتى 16 ميجابايت)
        </p>
        {attachments.length > 0 && (
          <ul className="space-y-2">
            {attachments.map((a, index) => (
              <li
                key={`${a.file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                <span className="flex-1 truncate">{a.file.name}</span>
                {a.uploaded && (
                  <span className="text-xs text-emerald-600">تم الرفع</span>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => removeFile(index)}
                  className="p-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-50"
                  aria-label={`حذف ${a.file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {fileError && <p className="text-xs text-red-600">{fileError}</p>}
      </div>

      {/* the private link */}
      <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          بعد الإرسال يصلك على واتساب رابط خاص لمتابعة طلبك والتواصل مع المستشار.
          هذا الرابط هو مفتاح طلبك، فلا تشاركه مع أي شخص.
        </p>
      </div>

      {draft && !isPending && (
        <p className="text-sm text-slate-600">
          تم حفظ ملخص القضية. أكمل رفع الملفات بإعادة المحاولة، أو احذف الملف
          الذي تعذر رفعه.
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-theme hover:bg-theme/90 text-white"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {isPending ? (stage ?? "جاري الإرسال...") : draft ? "إعادة المحاولة" : "إرسال الطلب"}
      </Button>
    </form>
  );
}
