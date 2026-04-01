"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Logo from "@/components/shared/logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";

// handlers
import { verifyToken } from "@/handlers/auth/verify";

// lib
// import { sendEmail } from "@/lib/mail";

// schemas
import { OtpSchema } from "@/schemas";

// icons
import { ArrowRight, Shield } from "lucide-react";

// schema type
type VerifyFormValues = z.infer<typeof OtpSchema>;

// props
interface Props {
  otp: string;
  name: string;
  phone: string;
}

const VerifyOtp: React.FC<Props> = ({ name, phone, otp }: Props) => {
  // whatsapp
  const whatsappMessage = `مرحباً، أريد تفعيل حسابي في شاورني. رقم هاتفي هو: ${phone}`;
  const WHATSAPP_URL = `https://wa.me/966554117879?text=${encodeURIComponent(whatsappMessage)}`;

  // states
  const [loading, setLoading] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(60);
  const [resendActive, setResendActive] = React.useState(false);

  // form handler
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: "" },
  });

  // countdown timer logic
  React.useEffect(() => {
    if (timeLeft <= 0) {
      setResendActive(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // on sumbit
  const onSubmit = async (data: VerifyFormValues) => {
    // laoding state
    setLoading(true);

    // verify token
    const response = await verifyToken(phone, data.otp);

    if (response.state) {
      // toast
      toast.success({
        title: "",
        message: "تم التحقق من رقم الهاتف بنجاح",
      });
    } else {
      // laoding state
      setLoading(false);
      // toast
      toast.error({ title: "", message: "الرمز غير صحيح، حاول مرة أخرى" });
    }
  };

  // resend otp
  const handleResend = async () => {
    // upadate states
    if (!resendActive) return;
    setResendActive(false);
    setTimeLeft(60);

    // resend
    try {
      //  await sendEmail(phone, name, otp);
      toast.success({ message: "تم إعادة إرسال رمز التحقق بنجاح" });
    } catch {
      toast.error({ message: "فشل إعادة إرسال الرمز، حاول لاحقاً" });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-5">
      <Card className="w-full max-w-lg py-8 px-5">
        <div className="flex items-center justify-center">
          <Logo width={200} height={200} />
        </div>

        <div className="flex items-center justify-between w-full">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-[#094577]">
              التحقق من رقم الهاتف
            </h2>
            <h5 className="text-slate-600 text-sm">
              لقد أرسلنا لك رمز التحقق على{" "}
              <span className="font-semibold">{phone}</span>
            </h5>
          </div>

          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} dir="ltr" className="space-y-6">
          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <>
                <InputOTP
                  maxLength={5}
                  value={field.value}
                  onChange={field.onChange}
                >
                  <InputOTPGroup className="flex gap-x-3 w-fit mx-auto">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        id={`otp-${index}`}
                        className="w-12 h-12 text-center border-2 border-slate-300 rounded-lg font-bold text-xl focus:outline-hidden focus:border-accent transition-colors"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {errors.otp && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.otp.message}
                  </p>
                )}
              </>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            تأكيد رقم الهاتف
          </Button>
        </form>

        <div className="flex items-center justify-center gap-3 text-center">
          <p className="text-slate-600 text-sm">لم تتلق الرمز؟</p>
          <button
            onClick={handleResend}
            disabled={!resendActive}
            className={`font-medium ${
              resendActive
                ? "text-[#117ED8] hover:underline"
                : "text-slate-400 cursor-not-allowed"
            }`}
          >
            {resendActive ? "إعادة الإرسال" : `إعادة الإرسال (${timeLeft}s)`}
          </button>
        </div>

        <div className="w-10/12 border-t border-slate-200 mx-auto pt-5">
          <Link
            href="/register"
            className="text-black hover:underline text-sm flex items-center justify-center gap-2"
          >
            <ArrowRight size={16} />
            العودة للتسجيل
          </Link>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
                group flex items-center justify-between
                px-2 sm:px-4 py-3 gap-2 sm:gap-3 rounded-xl
                bg-[#0794551a] hover:bg-[#34BE8F]/20
                border border-[#34BE8F]/30
                transition-colors duration-200
              "
            dir="rtl"
          >
            {/* right: text */}
            <div className="flex flex-col leading-tight gap-1">
              <span className="text-xs font-bold text-[#34BE8F]">
                فريقنا متاح لمساعدتك عبر واتساب الآن
              </span>
              <span className="text-[0.65rem] text-gray-500 font-medium">
                اذا لم تتلق الرمز، برجاء التواصل مع خدمة العملاء لتفعيل الحساب
              </span>
            </div>

            {/* left: WhatsApp button */}
            <div
              className="
                  flex items-center gap-1.5 shrink-0
                  bg-[#34BE8F] hover:bg-[#2aab7e]
                  text-white text-[0.7rem] font-semibold
                  px-3 py-1.5 rounded-full
                  transition-all duration-150
                  group-hover:shadow-md group-hover:scale-105
                "
            >
              {/* WhatsApp SVG icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                className="w-4 h-4 fill-white"
                aria-hidden="true"
              >
                <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.664 4.797 1.82 6.797L2 30l7.395-1.793A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.43 11.43 0 0 1-5.832-1.594l-.418-.248-4.387 1.063 1.094-4.27-.273-.44A11.46 11.46 0 0 1 4.5 16C4.5 9.596 9.596 4.5 16 4.5S27.5 9.596 27.5 16 22.404 27.5 16 27.5zm6.29-8.562c-.344-.172-2.04-1.006-2.355-1.12-.316-.115-.546-.172-.775.172-.23.344-.89 1.12-1.09 1.35-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.707-1.022-.912-1.713-2.037-1.913-2.381-.2-.344-.021-.53.15-.7.154-.154.344-.4.516-.6.172-.2.23-.344.344-.574.115-.23.058-.43-.029-.602-.086-.172-.775-1.87-1.062-2.561-.28-.672-.563-.58-.775-.59-.2-.01-.43-.012-.66-.012a1.27 1.27 0 0 0-.918.43c-.315.344-1.203 1.176-1.203 2.867s1.232 3.326 1.404 3.555c.172.23 2.425 3.703 5.875 5.192.82.354 1.46.566 1.959.724.822.262 1.571.225 2.162.137.66-.099 2.04-.834 2.328-1.639.287-.805.287-1.494.2-1.639-.086-.143-.315-.23-.66-.4z" />
              </svg>
              واتساب
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
};

export default VerifyOtp;
