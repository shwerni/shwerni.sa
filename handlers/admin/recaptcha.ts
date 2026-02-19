import { toast } from "@/components/shared/toast";
import { verifyRecaptcha } from "@/lib/api/recaptcha";

/**
 * Runs reCAPTCHA and verifies it with backend.
 * Returns the token if successful, otherwise null.
 */
export async function runRecaptcha(
  executeRecaptcha?: (action?: string) => Promise<string>,
): Promise<string | null> {
  if (!executeRecaptcha) {
    toast.error({
      title: "خطأ في الأمان",
      message:
        "تعذر تحميل أداة التحقق. برجاء إعادة المحاولة أو التواصل مع الدعم.",
    });
    return null;
  }

  try {
    // Execute reCAPTCHA
    const token = await executeRecaptcha();
    if (!token) throw new Error("تعذر إنشاء رمز التحقق.");

    // Verify token with backend
    const recaptchaValid = await verifyRecaptcha(token);
    if (!recaptchaValid)
      throw new Error("فشل التحقق من الأمان. برجاء إعادة المحاولة.");

    return token;
  } catch {
    toast.error({
      title: "فشل التحقق من الأمان",
      message: "حدث خطأ غير متوقع أثناء التحقق. حاول مرة أخرى لاحقًا.",
    });
    return null;
  }
}
