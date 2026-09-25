"use client";
// packages
import { useFormContext, useWatch } from "react-hook-form";

// components
import { FormSection } from "./form-section";

// schema
import {
  isCertRequired,
  type DocumentField,
  type ProfileFormValues,
} from "@/schemas/consultant/profile";

// icons
import { FileText } from "lucide-react";
import { FileUploadField } from "./file-upload";

// props
interface Props {
  author: string;
  disabled: boolean;
  certAlwaysRequired: boolean;
  onUploadingChange: (name: DocumentField, uploading: boolean) => void;
}

// photo + cv + education + license
export function DocumentsSection({
  author,
  disabled,
  certAlwaysRequired,
  onUploadingChange,
}: Props) {
  const { control } = useFormContext<ProfileFormValues>();
  const category = useWatch({ control, name: "category" });
  // same rule the schema enforces, so the badge never disagrees with validation
  const certRequired = isCertRequired(category, certAlwaysRequired);

  // shared props
  const shared = { author, disabled, onUploadingChange };

  return (
    <FormSection
      icon={FileText}
      title="المستندات"
      description="الشهادات والسيرة الذاتية بصيغة PDF، للمراجعة فقط ولا تظهر للعملاء"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FileUploadField
          {...shared}
          name="image"
          kind="image"
          label="الصورة الشخصية"
          description="صورة حقيقية وواضحة، لا تُقبل الصور الرمزية. تظهر للعملاء"
          required={false}
        />
        <FileUploadField
          {...shared}
          name="cv"
          kind="pdf"
          label="السيرة الذاتية"
          description="ملف PDF يوضح خبراتك العملية"
          required
        />
        <FileUploadField
          {...shared}
          name="edu"
          kind="pdf"
          label="شهادة المؤهل الدراسي"
          description="آخر مؤهل دراسي حصلت عليه"
          required
        />
        <FileUploadField
          {...shared}
          name="cert"
          kind="pdf"
          label="شهادة مزاولة المهنة"
          description="الترخيص المهني ساري المفعول"
          required
          // required={certRequired}
        />
      </div>
    </FormSection>
  );
}
