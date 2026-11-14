"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import { signOut } from "next-auth/react";

// components
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Logo from "@/components/shared/logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import PhoneInput from "@/components/shared/phone-input";

// actions
import {
  confirmAccountDeletion,
  sendAccountDeletionCode,
  startAccountDeletion,
  verifyAccountDeletionCode,
} from "@/actions/account-deletion";

// hooks
import { useAction } from "@/hooks/use-action";

// icons
import { ArrowRight, CircleCheck, Mail, ShieldAlert, Trash2 } from "lucide-react";

// support channels (the app's)
const SUPPORT_WHATSAPP = "https://wa.me/966554117879";
const SUPPORT_EMAIL = "support@shwerni.com";

// the app's texts (docs/client/account-deletion/spec.md)
const WILL_HAPPEN = [
  'تُمسح بياناتك الشخصية (الاسم ورقم الجوال والبريد الإلكتروني وكلمة المرور) ويحل محلها "مستخدم محذوف".',
  "يُغلق الحساب ويُسجَّل خروجك من جميع أجهزتك، ولا يمكن الدخول إليه مرة أخرى.",
];
const WILL_STAY = [
  "سجل الطلبات والمدفوعات والفواتير والمحادثات يبقى لأغراض محاسبية، دون اسمك أو رقم جوالك.",
];

type Blocker = { code: string; message: string };

// the steps: the phone (signed out), the check, the code, done
type Step =
  | { name: "loading" }
  | { name: "phone" }
  | { name: "check"; selfService: boolean; blockers: Blocker[] }
  | { name: "code"; sentTo: string }
  | { name: "done" };

const errors = {
  wrong_code: "رمز التحقق غير صحيح أو منتهي الصلاحية",
  not_self_service: "تواصل مع الدعم لإغلاق حساب المستشار",
  blocked: "لا يمكن حذف الحساب الآن",
};

const AccountDelete = () => {
  const [step, setStep] = React.useState<Step>({ name: "loading" });
  const [signedIn, setSignedIn] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  // signed out: the code was checked (the check is shown), the deletion uses it
  const [verified, setVerified] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // signed in → the account's check; signed out → the phone step
  const start = useAction(startAccountDeletion, {
    onSuccess: (data) => {
      setSignedIn(data.signedIn);
      setStep(
        data.signedIn
          ? { name: "check", selfService: data.selfService, blockers: data.blockers }
          : { name: "phone" },
      );
    },
  });

  const send = useAction(sendAccountDeletionCode, {
    errors,
    onSuccess: (data) => {
      setCode("");
      setStep({ name: "code", sentTo: data.sentTo });
    },
    // a blocker appeared: show the check again
    onError: (error) => {
      if (error === "blocked") start.execute({});
    },
  });

  const verify = useAction(verifyAccountDeletionCode, {
    errors,
    onSuccess: (data) => {
      setVerified(true);
      setStep({ name: "check", selfService: data.selfService, blockers: data.blockers });
    },
  });

  const confirm = useAction(confirmAccountDeletion, {
    errors,
    onSuccess: async () => {
      setConfirmOpen(false);
      setStep({ name: "done" });
      // the website session ends too (the server already refuses a deleted account)
      if (signedIn) await signOut({ redirect: false });
    },
    onError: (error) => {
      setConfirmOpen(false);
      if (error !== "blocked") return;
      // a blocker appeared: show the check again
      if (signedIn) start.execute({});
      else verify.execute({ phone, code });
    },
  });

  // first load, once (useAction's execute is a new function every render)
  const started = React.useRef(false);
  const startExecute = start.execute;
  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    startExecute({});
  }, [startExecute]);

  const sendCode = () => send.execute(signedIn ? {} : { phone });
  const codeComplete = /^\d{5}$/.test(code);

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-5 py-10">
      <Card className="w-full max-w-lg py-8 px-5 space-y-6">
        <div className="flex items-center justify-center">
          <Logo width={160} height={160} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-theme-700">حذف الحساب</h1>
            <p className="text-slate-600 text-sm">
              حذف حساب العميل برمز تحقق يصل إلى رقم الجوال المسجل
            </p>
          </div>
          <div className="flex items-center justify-center shrink-0 w-14 h-14 bg-red-50 rounded-full">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
        </div>

        {/* loading */}
        {step.name === "loading" && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {/* signed out: the phone */}
        {step.name === "phone" && (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
          >
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                <span className="text-red-700 font-medium">* </span>رقم الجوال المسجل في حسابك
              </label>
              <div dir="ltr">
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={(value) => setPhone(String(value ?? ""))}
                  placeholder="50000000"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!phone || send.isPending}
              loading={send.isPending}
            >
              إرسال رمز التحقق
            </Button>
          </form>
        )}

        {/* the check */}
        {step.name === "check" && !step.selfService && <SupportBox title={errors.not_self_service} />}

        {step.name === "check" && step.selfService && step.blockers.length > 0 && (
          <div className="space-y-4">
            <ul className="space-y-2">
              {step.blockers.map((blocker) => (
                <li key={blocker.code} className="flex gap-2 text-sm text-red-600 leading-6">
                  <ShieldAlert className="w-4 h-4 mt-1 shrink-0" />
                  {blocker.message}
                </li>
              ))}
            </ul>
            <SupportBox title="لا يمكن حذف الحساب الآن. تواصل مع الدعم وسنساعدك:" />
          </div>
        )}

        {step.name === "check" && step.selfService && step.blockers.length === 0 && (
          <div className="space-y-5">
            <Explainer />
            {signedIn || !verified ? (
              <Button
                variant="primary"
                className="w-full"
                onClick={sendCode}
                disabled={send.isPending}
                loading={send.isPending}
              >
                إرسال رمز التحقق
              </Button>
            ) : (
              <Button variant="destructive" className="w-full" onClick={() => setConfirmOpen(true)}>
                حذف الحساب نهائيًا
              </Button>
            )}
          </div>
        )}

        {/* the code */}
        {step.name === "code" && (
          <div className="space-y-6">
            <p className="text-slate-600 text-sm text-center">
              أدخل الرمز المرسل إلى <span dir="ltr" className="font-semibold">{step.sentTo}</span>
            </p>
            <div dir="ltr">
              <InputOTP maxLength={5} value={code} onChange={setCode}>
                <InputOTPGroup className="flex gap-x-3 w-fit mx-auto">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-12 h-12 text-center border-2 border-slate-300 rounded-lg font-bold text-xl focus:outline-hidden focus:border-accent transition-colors"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {signedIn ? (
              <Button
                variant="destructive"
                className="w-full"
                disabled={!codeComplete}
                onClick={() => setConfirmOpen(true)}
              >
                حذف الحساب نهائيًا
              </Button>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                disabled={!codeComplete || verify.isPending}
                loading={verify.isPending}
                onClick={() => verify.execute({ phone, code })}
              >
                تحقق
              </Button>
            )}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={sendCode}
                disabled={send.isPending}
                className="text-sm font-medium text-theme hover:underline disabled:text-slate-400"
              >
                إعادة إرسال الرمز
              </button>
            </div>
          </div>
        )}

        {/* done */}
        {step.name === "done" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CircleCheck className="w-12 h-12 text-green-600" />
            <h2 className="text-xl font-semibold text-theme-700">تم حذف حسابك</h2>
            <Link href="/" className="text-sm text-theme underline">
              العودة للرئيسية
            </Link>
          </div>
        )}

        {step.name !== "done" && (
          <div className="w-10/12 border-t border-slate-200 mx-auto pt-5">
            <Link
              href="/"
              className="text-black hover:underline text-sm flex items-center justify-center gap-2"
            >
              <ArrowRight size={16} />
              العودة للرئيسية
            </Link>
          </div>
        )}
      </Card>

      {/* the final confirm */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف الحساب نهائيًا؟</DialogTitle>
            <DialogDescription>
              سيُغلق حسابك وتُمسح بياناتك الشخصية ويُسجَّل خروجك من جميع الأجهزة فورًا
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              disabled={confirm.isPending}
              loading={confirm.isPending}
              onClick={() => confirm.execute(signedIn ? { code } : { phone, code })}
            >
              حذف
            </Button>
            <DialogClose asChild>
              <Button variant="outline">تراجع</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// what happens and what stays (the app's texts)
const Explainer = () => (
  <div className="space-y-4 text-sm leading-7 text-slate-700">
    <div className="space-y-1">
      <h3 className="font-semibold text-theme-700">ما سيحدث لحسابك</h3>
      <ul className="list-disc ps-5">
        {WILL_HAPPEN.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
    <div className="space-y-1">
      <h3 className="font-semibold text-theme-700">ما سيبقى</h3>
      <ul className="list-disc ps-5">
        {WILL_STAY.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
    <p className="font-medium text-red-600">
      يتم ذلك فورًا ولا يمكن التراجع عنه أو استرجاع الحساب بعده.
    </p>
  </div>
);

// the support channels
const SupportBox = ({ title }: { title: string }) => (
  <div className="space-y-3">
    <p className="text-sm text-slate-700 leading-7">{title}</p>
    <div className="flex flex-col gap-2">
      <a
        href={SUPPORT_WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0794551a] hover:bg-[#34BE8F]/20 border border-[#34BE8F]/30 transition-colors"
      >
        <span className="text-sm font-bold text-[#34BE8F]">واتساب</span>
        <span dir="ltr" className="text-xs text-gray-500">+966 55 411 7879</span>
      </a>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Mail className="w-4 h-4" />
          البريد الإلكتروني
        </span>
        <span dir="ltr" className="text-xs text-gray-500">{SUPPORT_EMAIL}</span>
      </a>
    </div>
  </div>
);

export default AccountDelete;
