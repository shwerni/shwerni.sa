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
      </Card>
    </div>
  );
};

export default VerifyOtp;
