"use client";
// React & Next
import React from "react";
import Image from "next/image";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast as sonner } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ZSection } from "@/app/_components/layout/section";
import ZPhoneInput from "@/app/_components/layout/phoneInput";
import { CopyTextEn } from "@/app/_components/layout/copyText";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import { SpinnerEn } from "@/app/_components/layout/skeleton/spinners";

// schemas
import { PhoneSchema } from "@/schemas";

// lib
import { smsSending } from "@/lib/api/sms";
import { adminCreateMeeting } from "@/lib/api/google";
import { notificationWTesting } from "@/lib/notifications/whatsapp";
import { timeZone } from "@/lib/site/time";

// types
interface DateTime {
  time: string;
  date: string;
}

export default function Ztest(props: { iTime: DateTime }) {
  // props
  const { iTime } = props;
  // on sending
  const [onSending, startSending] = React.useTransition();
  // google meet url
  const [url, setUrl] = React.useState<string | null>(null);
  // time and date
  const [time, setTime] = React.useState<DateTime | null>(iTime ?? null);

  // default input
  const whatsapp = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      phone: "",
    },
  });
  // default input
  const sms = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  // on sumbit
  function testWhatsapp(data: z.infer<typeof PhoneSchema>) {
    // update phone
    startSending(() => {
      notificationWTesting(data.phone).then((response) => {
        // error
        if (!response) {
          sonner.error("error sending message to " + data.phone);
          return;
        }
        // success
        sonner.success("message sent to " + data.phone);
      });
    });
  }

  // test sms
  function testSms(data: z.infer<typeof PhoneSchema>) {
    // update phone
    startSending(() => {
      smsSending(
        data.phone,
        `مستشارنا الكريم\nلديكم حجز جديد\n\nبيانات الحجز\nاسم العميل: يحيي\nرقم الطلب: 95\nالمدة: 45 دقيقة\nموعد الاستشارة: الحجز يوم الجمعة الموافق 2024-12-06 الساعة 05:00 صباحا\n https://shwerni.sa/meeting/uw?participant=owner`,
        // `Shwerni.sa\nThis message confirms that your phone number ${data.phone} is successfully receiving messages from SMS`
      ).then((response) => {
        // error
        if (!response) {
          sonner.error("error sending message to " + data.phone);
          return;
        }
        // success
        sonner.success("message sent to " + data.phone);
      });
    });
  }

  // create google meet
  const createMeeting = () => {
    startSending(() => {
      adminCreateMeeting().then((response) => {
        setUrl(response || "");
      });
    });
  };
  // get time zone date & time
  const getTimeAndDate = () => {
    // start loading
    startSending(() => {
      // get time and date
      const { time, date } = timeZone();
      // set time
      setTime({ time, date });
    });
  };

  // return
  return (
    <ZSection>
      <div className="w-10/12 max-w-[500px] md:mx-12 space-y-10">
        {/* title */}
        <h3 className="text-xl">testing</h3>
        {/* testing whatsapp */}
        <div className="space-y-5">
          {/* title */}
          <div className="flex flex-row gap-1">
            <Image
              src="/svg/whatsapp2.svg"
              width={15}
              height={15}
              alt="google meet"
            />
            <h3>whatsapp</h3>
          </div>
          {/* phone input */}
          <div className="mx-3 sm:mx-5">
            {/* phone input form */}
            <Form {...whatsapp}>
              <form
                onSubmit={whatsapp.handleSubmit(testWhatsapp)}
                className="w-2/3 space-y-6"
              >
                {/* phone number */}
                <FormField
                  control={whatsapp.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zgrey-100">
                        phone number
                      </FormLabel>
                      <FormControl>
                        <div className="w-fit">
                          <ZPhoneInput
                            backGroundColor="white"
                            value={field.value}
                            onChange={field.onChange}
                            disabled={onSending}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>test whatsapp messages</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* submit button */}
                <Button disabled={onSending} type="submit">
                  <LoadingBtnEn loading={onSending}>send message</LoadingBtnEn>
                </Button>
              </form>
            </Form>
          </div>
        </div>
        {/* separator */}
        <Separator className="w-10/12 mx-auto" />
        {/* testing sms */}
        <div className="space-y-5">
          {/* title */}
          <div className="flex flex-row gap-1">
            <Image src="/svg/sms.svg" width={25} height={25} alt="sms" />
            <h3>sms</h3>
          </div>
          {/* phone input */}
          <div className="mx-3 sm:mx-5">
            {/* phone input form */}
            <Form {...sms}>
              <form
                onSubmit={sms.handleSubmit(testSms)}
                className="w-2/3 space-y-6"
              >
                {/* phone number */}
                <FormField
                  control={sms.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zgrey-100">
                        phone number
                      </FormLabel>
                      <FormControl>
                        <div className="w-fit">
                          <PhoneInput
                            onlyCountries={["sa"]}
                            country={"sa"}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={onSending}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>test sms messages</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* submit button */}
                <Button disabled={onSending} type="submit">
                  <LoadingBtnEn loading={onSending}>send message</LoadingBtnEn>
                </Button>
              </form>
            </Form>
          </div>
        </div>
        {/* separator */}
        <Separator className="w-10/12 mx-auto" />
        {/* testing google meet */}
        <div className="space-y-5">
          {/* title */}
          <div className="flex flex-row gap-1">
            <Image
              src="/svg/goolgeMeet.svg"
              width={25}
              height={25}
              alt="google meet"
            />
            <h3>google meet</h3>
          </div>
          {/* google meet */}
          <div className="mx-3 sm:mx-5 space-y-5">
            {onSending ? (
              <SpinnerEn />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-1">
                <h5>{url ?? "no meeting has created yet"}</h5>
                {url && <CopyTextEn label={url} text={url} />}
              </div>
            )}
            <Button onClick={() => createMeeting()} disabled={onSending}>
              <LoadingBtnEn loading={onSending}>
                create google meeting
              </LoadingBtnEn>
            </Button>
          </div>
        </div>
        {/* separator */}
        <Separator className="w-10/12 mx-auto" />
        {/* testing time zone */}
        <div className="space-y-5">
          {/* title */}
          <div className="flex flex-row gap-1">
            <Image src="/svg/earth.svg" width={25} height={25} alt="timezone" />
            <h3 className="pt-1">timezone api</h3>
          </div>
          {/* time zone */}
          <div className="mx-3 sm:mx-5 space-y-5">
            <div className="flex flex-row items-center gap-1">
              {onSending ? (
                <SpinnerEn />
              ) : (
                <>
                  {time ? (
                    <div className="rflex gap-1.5">
                      <h5>{time.time}</h5>
                      <h5>|</h5>
                      <h5>{time.date}</h5>
                      <h5>Asia/Riyadh UTC+3</h5>
                    </div>
                  ) : (
                    "time not generated yet"
                  )}
                </>
              )}
            </div>
            <Button onClick={() => getTimeAndDate()} disabled={onSending}>
              <LoadingBtnEn loading={onSending}>refresh time</LoadingBtnEn>
            </Button>
          </div>
        </div>
      </div>
    </ZSection>
  );
}
