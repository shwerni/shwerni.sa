"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import moment from "moment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ZToast } from "@/app/_components/layout/toasts";

// handlers
import {
  unauthorizedPhoneChangeByToken,
  userInfoChange,
  userPasswrodChange,
} from "@/handlers/auth/userInfo";

// types
import { User } from "@/lib/generated/prisma/client";

// schemas
import { PasswordSchema, PhoneSchema, UserSchema } from "@/schemas";

// icons
import { KeyRound, Phone, Save, Shield, User2 } from "lucide-react";

// user profile form
export default function UserSettings({
  user,
  time,
  date,
}: {
  user: User | null;
  time: string;
  date: string;
}) {
  // on sending
  const [isSending, startSending] = React.useTransition();

  // time now
  const timeNow = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");

  // time differnce since last updat of user info
  const diff = user?.updated_at
    ? timeNow.diff(moment(user?.updated_at), "minutes")
    : 15;

  // upadate time
  const [updateAble, setUpdate] = React.useState<boolean>(diff < 15);

  // default input
  const userInfo = useForm<z.infer<typeof UserSchema>>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      username: user?.name || "",
      email: user?.email || "",
    },
  });
  // default input
  const security = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  // default input
  const phoneNumber = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      phone: user?.phone || "",
    },
  });

  // handle user change
  function updateUserInfo(data: z.infer<typeof UserSchema>) {
    // if data unchange
    if (
      user?.name === data.username &&
      (!data.email || user?.email || user?.email === data.email)
    )
      return ZToast({
        state: false,
        message: "هذه المعلومات موجودة بالفعل",
      });
    // update user info
    startSending(() => {
      if (user?.id)
        userInfoChange(data, user?.id).then((response) => {
          // toast response
          if (response) {
            if (response.state) {
              // update current user ref
              user.name = data.username;
              user.email = String(data.email);
            }
            // update user info state
            setUpdate(true);
            // return
            return ZToast({
              state: response?.state,
              message: response?.message,
            });
          } else {
            // some thing went wrong
            return ZToast({
              state: false,
              message: "حدث خطأ ما",
            });
          }
        });
    });
  }

  // on sumbit
  function updateSecurity(data: z.infer<typeof PasswordSchema>) {
    // update user info
    startSending(() => {
      if (user?.id)
        userPasswrodChange(data, user?.id).then((response) => {
          // toast response
          if (response) {
            // update user info state
            setUpdate(true);
            // return
            return ZToast({
              state: response?.state,
              message: response?.message,
            });
          } else {
            // some thing went wrong
            return ZToast({
              state: false,
              message: "حدث خطأ ما",
            });
          }
        });
    });
  }

  // on sumbit
  function updatePhoneNumber(data: z.infer<typeof PhoneSchema>) {
    // update phone
    startSending(() => {
      // if data unchange
      if (user?.phone === data.phone) {
        // unchanged data
        ZToast({
          state: false,
          message: "هذه المعلومات موجودة بالفعل",
        });
        // return
        return;
      }
      // change phone number
      if (user?.phone)
        unauthorizedPhoneChangeByToken(data, user?.phone).then((response) => {
          // if response not exist
          if (!response || typeof response === "string") return;
          // toast response
          if (response?.state || response?.state === false) {
            // update user info state
            setUpdate(true);
            // return
            return ZToast({
              state: response?.state,
              message: response?.message,
            });
          }
        });
    });
  }

  // return
  return (
    <>
      {/* 15 min update break alert */}
      {diff < 15 && (
        <h6 className="text-red-500">
          برجاء الانتظار {15 - diff === 1 ? "دقيقة" : `${15 - diff}  دقائق`}{" "}
          لتتمكن من التعديل علي بيانات حسابك
        </h6>
      )}
      {/* user info profile page */}
      <div className="flex flex-col gap-10 my-10">
        {/* name and email */}
        <div className="flex flex-col gap-5">
          <h3 className="flex flex-row  items-center gap-1 text-zblue-200">
            <User2 />
            معلومات المستخدم
          </h3>
          {/* name and email */}
          <Form {...userInfo}>
            <form
              dir="rtl"
              onSubmit={userInfo.handleSubmit(updateUserInfo)}
              className="w-2/3 space-y-6"
            >
              {/* user name */}
              <FormField
                control={userInfo.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="اسم المستخدم"
                        {...field}
                        disabled={isSending || updateAble}
                      />
                    </FormControl>
                    <FormDescription>اسم مستخدم الحساب</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* email */}
              <FormField
                control={userInfo.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    {/* email */}
                    <FormLabel>عنوان البريد الالكتروني</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="البريد الالكتروني"
                        {...field}
                        disabled={isSending || updateAble}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* submit button */}
              <Button
                disabled={isSending || updateAble}
                type="submit"
                className="bg-zblue-200 gap-1"
              >
                <Save className="w-5" />
                تغيير معلومات الحساب
              </Button>
            </form>
          </Form>
        </div>
        {/* separator */}
        <Separator className="w-10/12 mx-auto" />
        {/* security & password*/}
        <div className="flex flex-col gap-5">
          <h3 className="flex flex-row  items-center gap-1 text-zblue-200">
            <Shield />
            الامن
          </h3>
          {/* password */}
          <Form {...security}>
            <form
              dir="rtl"
              onSubmit={security.handleSubmit(updateSecurity)}
              className="w-2/3 space-y-6"
            >
              {/* password */}
              <FormField
                control={security.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    {/* email */}
                    <FormLabel>كلمة مرور جديدة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="كلمة مرور جديدة"
                        {...field}
                        disabled={isSending || updateAble}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* submit button */}
              <Button
                disabled={isSending || updateAble}
                type="submit"
                className="bg-zblue-200 gap-1"
              >
                <KeyRound className="w-5" />
                تغيير كلمة المرور
              </Button>
            </form>
          </Form>
        </div>
        {/* separator */}
        <Separator className="w-10/12 mx-auto" />
        {/* contact and phone */}
        <div className="flex flex-col gap-5">
          <h3 className="flex flex-row  items-center gap-1 text-zblue-200">
            <Phone />
            معلومات الاتصال
          </h3>
          {/* phone number */}
          <Form {...phoneNumber}>
            <form
              dir="rtl"
              onSubmit={phoneNumber.handleSubmit(updatePhoneNumber)}
              className="w-2/3 space-y-6"
            >
              {/* phone number */}
              <FormField
                control={phoneNumber.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <div dir="ltr" className="w-fit">
                        <PhoneInput
                          onlyCountries={[
                            "sa",
                            "eg",
                            "ps",
                            "qa",
                            "om",
                            "ae",
                            "kw",
                          ]}
                          country={"sa"}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSending}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      هاتفك المحمول يجب ان يكون مربوط بالواتس اب
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* submit button */}
              <Button
                disabled={isSending || updateAble}
                type="submit"
                className="bg-zblue-200 gap-1"
              >
                <Phone className="w-5" />
                تغيير رقم الهاتف
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
