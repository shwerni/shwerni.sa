// EditFreeSession.tsx
"use client";

// React & Next
import React from "react";

// packages
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast as sonner } from "sonner";
import { CopyTextEn } from "@/app/_components/layout/copyText";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";

// types

// utils
import { meetingUrl } from "@/utils";

// schema
import { FreeSessionSchema, } from "@/schemas/admin";

// data
import { updateFreeSessionAdmin } from "@/data/admin/freesession";
import { FreeSession } from "@/lib/generated/prisma/client";

// types
type Session = (FreeSession & { consultant: { name: string } })

interface Props {
  session: Session;
  lang?: "en" | "ar";
}

export default function EditFreeSessionForm({ session, lang }: Props) {
  const isEn = !lang || lang === "en";
  const [isSending, startSending] = React.useTransition();

  function onSubmit(data: z.infer<typeof FreeSessionSchema>) {
    startSending(() => {
      updateFreeSessionAdmin(session.fid, data).then((response) => {
        if (response) {
          sonner.success(isEn ? "session updated" : "تم تحديث الجلسة بنجاح");
        } else {
          sonner.error(isEn ? "error occurred" : "حدث خطأ ما");
        }
      });
    });
  }

  const form = useForm<z.infer<typeof FreeSessionSchema>>({
    resolver: zodResolver(FreeSessionSchema),
    defaultValues: {
      ownerAttend: session?.ownerAttend ?? false,
      clientAttend: session?.clientAttend ?? false,
      clientATime: session?.clientATime ?? "",
      ownerATime: session?.ownerATime ?? "",
      url: session?.url ?? "",
    },
  });

  const Info = (label: string, value?: string | number) => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 h-14">
      <h6 className="text-center">{label}</h6>
      <h6 className="text-center">{value}</h6>
    </div>
  );

  const Url = (label: string, value?: string) => (
    <div className="flex flex-col items-start">
      <h6>{label}</h6>
      <CopyTextEn label={value} text={value ?? ""} />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* session info */}
      <div className="rflex gap-5">
        {Info(isEn ? "client" : "العميل", session.name)}
        <Separator className="h-7" orientation="vertical" />
        {Info(isEn ? "owner" : "المستشار", session.consultant.name)}
        <Separator className="h-7" orientation="vertical" />
        {Info(isEn ? "date" : "التاريخ", session.date)}
        <Separator className="h-7" orientation="vertical" />
        {Info(isEn ? "time" : "الوقت", session.time)}
      </div>

      {/* URLs */}
      <div className="flex flex-col gap-2">
        {/* later free session seprate url */}
        {Url(isEn ? "client url" : "رابط العميل", meetingUrl(session.fid, false, 1))}
        {Url(isEn ? "owner url" : "رابط المستشار", meetingUrl(session.fid, true, 1))}
        {session.url && Url(isEn ? "google url" : "رابط مباشر", session.url)}
      </div>

      {/* form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          <div className="grid grid-cols-2 gap-5">
            {/* client time */}
            <FormField
              control={form.control}
              name="clientATime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "client time" : "موعد العميل"}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* owner time */}
            <FormField
              control={form.control}
              name="ownerATime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "owner time" : "موعد المستشار"}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* client attend */}
            <FormField
              control={form.control}
              name="clientAttend"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>{isEn ? "client attended" : "العميل حضر"}</FormLabel>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="!mt-0" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* owner attend */}
            <FormField
              control={form.control}
              name="ownerAttend"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>{isEn ? "owner attended" : "المستشار حضر"}</FormLabel>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="!mt-0" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* google url */}
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEn ? "google url" : "رابط جوجل المباشر"}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* footer */}
          <div className="flex justify-between items-center">
            {isEn && (
              <Button type="submit" className="zgreyBtn">
                <LoadingBtnEn loading={false}>send notify</LoadingBtnEn>
              </Button>
            )}
            <Button type="submit">
              <LoadingBtnEn loading={false}>
                {isEn ? "save changes" : "حفظ التغييرات"}
              </LoadingBtnEn>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
