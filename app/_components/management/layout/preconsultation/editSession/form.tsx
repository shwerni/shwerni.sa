"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast as toast } from "sonner";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import { AutosizeTextarea } from "@/app/_components/layout/shadcnM/autoSizeTextarea";

// prisma types
import { PreConsultation } from "@/lib/generated/prisma/client";

// utils
import { isEnglish } from "@/utils";

// prisma data
import { updatePreConsultationSeassion } from "@/data/preconsultation";

// icons
import { AdvisorResponse } from "@/schemas";

// Props
interface Props {
  advisorId: string | undefined;
  session: PreConsultation;
  lang?: "en" | "ar";
}

export default function EmployeePreConsultationForm({
  advisorId,
  session,
  lang,
}: Props) {
  // langauge check
  const isEn = isEnglish(lang);

  // on send
  const [isSending, startSending] = React.useTransition();

  // form
  const form = useForm<z.infer<typeof AdvisorResponse>>({
    resolver: zodResolver(AdvisorResponse),
    defaultValues: {
      response: session.response ?? "",
    },
  });

  // on submit
  function onSubmit(data: z.infer<typeof AdvisorResponse>) {
    startSending(() => {
      if (session && session.pid && advisorId) {
        updatePreConsultationSeassion(session.id, advisorId ?? "", data).then(
          (response) => {
            if (response) {
              // on sucess
              toast.success("تم حفظ اتوجيه بنجاح");
              // reload page
              window.location.reload();
              // return
              return;
            }
            // error
            toast.error("لم يتم حفظ التوجيه");
          }
        );
      }
    });
  }

  // return
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          {/* response */}
          <FormField
            control={form.control}
            name="response"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اكتب التوصيات والتوجيه</FormLabel>
                <FormControl>
                  <AutosizeTextarea
                    placeholder="التوصيات والتوجيه"
                    className="resize-none max-h"
                    {...field}
                    disabled={isSending}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* footer */}
          <Button type="submit">
            <LoadingBtnEn loading={isSending}>
              {session.response ? "تعديل" : "ارسال"}
            </LoadingBtnEn>
          </Button>
        </form>
      </Form>
    </>
  );
}
