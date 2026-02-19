"use client";
// React & Next
import React from "react";
import Link from "next/link";

// componments
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// icon
import { TriangleAlert } from "lucide-react";
import { phoneToken } from "@/handlers/auth/verify";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export default function ErrorVerify({ phone }: { phone: string }) {
  // on send
  const [onSend, startSending] = React.useTransition();

  // on submit
  function onSubmit() {
    startSending(() => {
      phoneToken(phone);
    });
  }

  //not found page content
  return (
    <div className="cflex gap-5 min-h-semiFull my-20" dir="rtl">
      <div className="cflex gap-10">
        {/* error message  */}
        <div className="cflex gap-5 sm:gap-10">
          {/* error title */}
          <div className="cflex gap-2">
            <h2 className="rflex gap-4 text-xl tracking-tight font-extrabold text-red-500">
              يجب تأكيد رقم الهاتف
            </h2>
            <h3 className="text-base">
              المعذرة، يجب عليك اولا تأكيد رقم الهاتف.
            </h3>
          </div>
          <div className="cflex">
            <Button
              className="bg-zblue-200"
              onClick={onSubmit}
              loading={onSend}
            >
              تأكيد رقم الهاتف
            </Button>
          </div>
          {/* return home */}
          <Link href="/">
            <Button className="zgreyBtn">العودة للصفحة الرئيسية</Button>
          </Link>
        </div>
      </div>
      {/* seperator */}
      <Separator className="w-10/12" />
      {/* alert if user */}
      <div className="cflex gap-3 max-w-[400px] w-11/12 mx-auto">
        {/* role alert */}
        <Alert
          variant="destructive"
          className="flex flex-row  items-start gap-3"
        >
          <div>
            <TriangleAlert className="relative w-5" />
          </div>
          <div className="flex flex-col items-start gap-1">
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>
              يجب تأكيد رقم الهاتف للدخول لصفحات التحكم في الحساب
            </AlertDescription>
          </div>
        </Alert>
        {/* sign out button */}
        <Link href="/logout">
          <Button className="bg-red-500 mx-auto">تسجيل الخروج</Button>
        </Link>
      </div>
    </div>
  );
}
