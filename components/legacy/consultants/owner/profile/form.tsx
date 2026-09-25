"use client";
// React & Next
import React from "react";

// packages
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ZToast } from "@/components/legacy/layout/toasts";
import LoadingBtn from "@/components/legacy/layout/loadingBtn";
import { BasicInfoSection } from "./basic-info-section";
import { DocumentsSection } from "./documents-section";
import { ExpertiseSection } from "./expertise-section";
import { PricingSection } from "./pricing-section";
import { ProfileStatus } from "./profile-status";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/enums";
import { BankAccount, Consultant } from "@/lib/generated/prisma/client";

// handlers
import { saveConsultant } from "@/handlers/conusltant/owner/profile";

// schema
import {
  createProfileFormSchema,
  getProfileFormDefaults,
  isCertAlwaysRequired,
  yearsToDate,
  type DocumentField,
  type ProfileFormValues,
} from "@/schemas/consultant/profile";

// icons
import { AlertCircle, CirclePlus, Save } from "lucide-react";
import { BankSection } from "./bank-section";

// props
interface Props {
  author: string;
  owner: Consultant | null;
  phone: string;
  bankAccount: BankAccount | null;
}

// consultant profile form
export default function CoProfileForm({
  author,
  owner,
  phone,
  bankAccount,
}: Props) {
  // loading submit
  const [isSending, startSending] = React.useTransition();

  // consultant (updates after create / save)
  const [consultant, setConsultant] = React.useState<
    Consultant | null | undefined
  >(owner);

  // per-field upload state; submit is blocked while any upload runs
  const [uploading, setUploading] = React.useState<
    Partial<Record<DocumentField, boolean>>
  >({});
  const isUploading = Object.values(uploading).some(Boolean);
  const setFieldUploading = React.useCallback(
    (name: DocumentField, value: boolean) =>
      setUploading((prev) => ({ ...prev, [name]: value })),
    [],
  );

  // schema depends on whether the license is required for this owner
  const certAlwaysRequired = isCertAlwaysRequired(owner);
  const schema = React.useMemo(
    () => createProfileFormSchema(certAlwaysRequired),
    [certAlwaysRequired],
  );

  // form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getProfileFormDefaults(owner, bankAccount),
    mode: "onTouched",
  });

  const { errors, submitCount } = form.formState;
  const hasErrors = submitCount > 0 && Object.keys(errors).length > 0;

  // on submit (runs only when every field, including uploads, is valid)
  function onSubmit(values: ProfileFormValues) {
    const { image, cv, edu, cert, years, holderName, iban, ...profile } =
      values;

    startSending(() => {
      saveConsultant(
        author,
        phone,
        profile,
        image,
        cv,
        edu,
        cert,
        profile.nabout ?? "",
        profile.nexperiences,
        profile.neducation,
        profile.preference ?? GenderPreference.BOTH,
        yearsToDate(years).toISOString(),
        { holderName, iban },
      ).then((response) => {
        if (!response) return;
        // toast result
        ZToast(response);
        // update consultant + mark current values as saved
        if (response.state && response.consultant) {
          setConsultant(response.consultant);
          form.reset(values);
        }
      });
    });
  }

  // on invalid: every error is already shown inline; first one is focused
  function onInvalid() {
    ZToast({
      state: false,
      message: "يرجى تصحيح الحقول المحددة باللون الأحمر",
    });
  }

  // return
  return (
    <>
      {/* status */}
      <ProfileStatus author={author} consultant={consultant} />

      <Separator className="w-3/4 my-3 mx-auto" />

      {/* profile form */}
      <Form {...form}>
        <form
          dir="rtl"
          noValidate
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="max-w-180 sm:w-11/12 my-5 space-y-8"
          id="imp-data"
        >
          <BasicInfoSection disabled={isSending} />
          <ExpertiseSection disabled={isSending} />
          <PricingSection disabled={isSending} />
          <DocumentsSection
            author={author}
            disabled={isSending}
            certAlwaysRequired={certAlwaysRequired}
            onUploadingChange={setFieldUploading}
          />
          <BankSection disabled={isSending} />

          {/* submit bar: stays visible while scrolling a long form */}
          <div className="sticky bottom-0 z-10 -mx-2 flex flex-col gap-3 border-t border-zgrey-50 bg-background/95 px-2 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {hasErrors && (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  بعض الحقول تحتاج إلى تصحيح
                </p>
              )}
              {isUploading && (
                <p className="text-xs text-muted-foreground">
                  جارٍ رفع الملفات، انتظر حتى يكتمل الرفع
                </p>
              )}
              {consultant && !hasErrors && !isUploading && (
                <p className="text-xs text-muted-foreground">
                  تغيير الاسم أو الصورة أو النبذة قد يعيد الإعلان للمراجعة قبل
                  النشر
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSending || isUploading}
              className="w-full sm:w-44 shrink-0 bg-zblue-200 rounded-2xl gap-1"
            >
              <LoadingBtn loading={isSending}>
                {consultant ? (
                  <>
                    حفظ التغييرات
                    <Save className="w-5" />
                  </>
                ) : (
                  <>
                    إنشاء الإعلان
                    <CirclePlus className="w-5" />
                  </>
                )}
              </LoadingBtn>
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
