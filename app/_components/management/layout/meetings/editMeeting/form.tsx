"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast as sonner } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";

// prisma data
import { updateMeetingAdmin } from "@/data/admin/meeting";

// prisma types
import { OrderType } from "@/lib/generated/prisma/enums";

// schema
import { MeetingSchema } from "@/schemas/admin";

// utils
import { timeOptions, meetingUrl } from "@/utils";
import { Label } from "@/components/ui/label";
import { DatePicker } from "../../datePicker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateToString, timeToArabic } from "@/utils/moment";
import CopyBtn from "@/app/_components/layout/copyBtn";
import { Meeting } from "@/lib/generated/prisma/client";

// props
interface Props {
  client: string;
  consultant: string;
  meeting: Meeting;
  type: OrderType;
  lang?: "en" | "ar";
}

const MeetingInfo = (props: { label: string; value: string | undefined }) => {
  // props
  const { label, value } = props;
  // return
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 h-14">
      <h6 className="text-center">{label}</h6>
      <h6 className="text-center">{value}</h6>
    </div>
  );
};

const MeetingUlrs = (props: { label: string; value: string | undefined }) => {
  // props
  const { label, value } = props;
  // return
  if (value)
    return (
      <div className="flex flex-col items-start">
        <h6>{label}</h6>
        <div className="inline-flex items-center gap-2">
          <h6 className="font-semibold">{value}</h6>
          <CopyBtn copy={value} label="" className="!bg-transparent" />
        </div>
      </div>
    );
};

export default function EditMeetingForm({
  meeting,
  client,
  consultant,
  type,
  lang,
}: Props) {
  // check langauge
  const isEn = !lang || lang === "en";

  // on send
  const [isSending, startSending] = React.useTransition();

  // date
  const [date, setDate] = React.useState<string>(
    meeting ? meeting.date : dateToString(new Date()),
  );

  // form
  function onSubmit(data: z.infer<typeof MeetingSchema>) {
    startSending(() => {
      if (meeting.orderId)
        updateMeetingAdmin(meeting.orderId, meeting.session, date, data).then(
          (response) => {
            if (response) {
              sonner.success(
                isEn
                  ? "meeting has been successfully updated"
                  : "تم حفظ التغييرات بنجاح",
              );
            } else {
              sonner.error(isEn ? "error has occurred" : "حدث خطأ ما");
            }
          },
        );
    });
  }

  // form
  const form = useForm<z.infer<typeof MeetingSchema>>({
    resolver: zodResolver(MeetingSchema),
    defaultValues: {
      done: meeting?.done,
      time: meeting?.time ?? "",
      consultantAttendance: meeting?.consultantAttendance ?? false,
      clientAttendance: meeting?.clientAttendance ?? false,
      clientJoinedAt: meeting?.clientJoinedAt ?? "",
      consultantJoinedAt: meeting?.consultantJoinedAt ?? "",
      url: meeting?.url ?? "",
    },
  });

  // return
  return (
    <div className="space-y-10">
      {/* meeting info */}
      <div className="rflex gap-5">
        {/* client name */}
        <MeetingInfo label="client" value={client} />
        {/* separator */}
        <Separator className="h-7" orientation="vertical" />
        {/* owner name */}
        <MeetingInfo label="consultant" value={consultant} />
        {/* separator */}
        <Separator className="h-7" orientation="vertical" />
        {/* date */}
        <MeetingInfo label="date" value={meeting?.date} />
        {/* separator */}
        <Separator className="h-7" orientation="vertical" />
        {/* time */}
        <MeetingInfo label="time" value={meeting?.time} />
      </div>
      {/* copy meetings urls */}
      {meeting?.orderId && (
        <div className="flex flex-col gap-2">
          {/* copy client url */}
          <MeetingUlrs
            label={isEn ? "client url" : "رابط العميل"}
            value={meetingUrl(meeting?.orderId, false, meeting?.session ?? 1)}
          />
          {/* copy owner url */}
          <MeetingUlrs
            label={isEn ? "owner url" : "رابط المستشار"}
            value={meetingUrl(meeting?.orderId, true, meeting?.session ?? 1)}
          />
          {/* copy google meet */}
          {meeting?.url && (
            <MeetingUlrs
              label={isEn ? "google meet url" : "رابط مباشر"}
              value={meeting.url}
            />
          )}
        </div>
      )}
      <Separator className="w-10/12 max-w-lg mx-auto" />
      {/* form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* meeting client time */}
            <FormField
              control={form.control}
              name="clientJoinedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "client time" : "ميعاد حضور العميل"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "client time" : "ميعاد حضور العميل"}
                      {...field}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* meeting owner time */}
            <FormField
              control={form.control}
              name="consultantJoinedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "consultant time" : "ميعاد حضور المستشار"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "owner time" : "ميعاد حضور المستشار"}
                      {...field}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* total & tax */}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* did client attend */}
            <FormField
              control={form.control}
              disabled={isSending}
              name="clientAttendance"
              render={({ field }) => (
                <div className="flex flex-row items-start gap-2 space-y-0">
                  {/* terms and conditions */}
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        {isEn ? "client attend" : "حضور العميل"}
                      </FormLabel>
                    </div>
                    <div className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{isEn ? "attend" : "حضر"}</FormLabel>
                      </div>
                    </div>
                  </FormItem>
                </div>
              )}
            />
            {/* did owner attend */}
            <FormField
              control={form.control}
              disabled={isSending}
              name="consultantAttendance"
              render={({ field }) => (
                <div className="flex flex-row items-start gap-2 space-y-0">
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        {isEn ? "consultant attend" : "حضور المستشار"}
                      </FormLabel>
                    </div>
                    <div className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{isEn ? "attend" : "حضر"}</FormLabel>
                      </div>
                    </div>
                  </FormItem>
                </div>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* google url */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "google url" : "رابط جوجل المباشر"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "google url" : "رابط جوجل المباشر"}
                      {...field}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              disabled={isSending}
              name="done"
              render={({ field }) => (
                <div className="flex flex-row items-start gap-2 space-y-0">
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        {isEn ? "manual state" : "حاله الاجتماع (يدوي)"}
                      </FormLabel>
                    </div>
                    <div className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{isEn ? "done" : "تمت"}</FormLabel>
                      </div>
                    </div>
                  </FormItem>
                </div>
              )}
            />
          </div>
          {/* date & time */}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* date */}
            <div className="flex flex-col justify-between">
              <Label>{isEn ? "meeting date" : "تاريخ الاجتماع"}</Label>
              <DatePicker setDate={setDate} lang={lang} date={date} />
            </div>
            {/* time */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "time" : "موعد الاجتماع"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom">
                      <SelectGroup>
                        {timeOptions.map((i, index) => (
                          <SelectItem key={index} value={i.value}>
                            {isEn ? i.value : timeToArabic(i.value)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* footer */}
          <div className="flex justify-between items-center">
            {/* resend meetings notify */}
            {isEn && (
              <Button type="submit" className="zgreyBtn">
                <LoadingBtnEn loading={false}>send notify</LoadingBtnEn>
              </Button>
            )}
            {/* save */}
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
