import "server-only";
// React & Next
import { redirect } from "next/navigation";

// packages
import { z } from "zod";

// schemas
import { PhoneSchema, ResetSchema } from "@/schemas";

// lib
import { notificationSecurityOtp } from "@/lib/notifications/site";
import { hashWebsitePassword } from "@/lib/auth/password";

// utils
import { withCallbackUrl } from "@/utils/callback-url";

// handlers
import { otpFailure, readOtpAttempt, type OtpFailure } from "@/handlers/auth/otp";

// prisma data
import {
  completePasswordReset,
  generateVerificationToken,
} from "@/data/verificationTokens";
import { getUserByPhone } from "@/data/user";
import { CheckIsBlocked } from "@/data/blocked";

export const forgetpassowrd = async (
  data: z.infer<typeof PhoneSchema>,
  // carried to the reset page and then the login (allow-listed only)
  callbackUrl?: string,
) => {
  // reset fields { newpassword, confirmphone, phone}
  const validatedFields = PhoneSchema.safeParse(data);

  if (!validatedFields.success)
    // will not reach this so no need but keep fo unsuring
    return { state: false, message: "برجاء ادخال جميع البيانات" };

  // get data
  const { phone } = validatedFields.data;

  // get user by phone
  const userExist = await getUserByPhone(phone);

  // check if blocked
  const isBLocked = await CheckIsBlocked(phone);

  // vakidate
  if (isBLocked) return { state: false, message: "هذا الحساب محظور" };

  // if user or phone number exist
  if (!userExist) return { state: false, message: "لا يوجد حساب بهذا الرقم" };

  // generate token
  const verificationToken = await generateVerificationToken(phone);

  // if not exist
  if (!verificationToken?.otp || !verificationToken?.phone)
    return { state: false, message: "حدث خطأ ما برجاء اعادة المحاولة" };

  //  send otp via whatsapp
  await notificationSecurityOtp(
    verificationToken?.phone,
    userExist?.name || "",
    verificationToken?.otp,
  );

  // redirect to otp verify page
  redirect(withCallbackUrl(`/reset-password?token=${verificationToken?.token}`, callbackUrl));
};

/**
 * the forgot-password otp: one try of the code, then the token is claimed and the new password
 * saved in one transaction (completePasswordReset). a second submit of a code this flow already
 * used continues to the login when the first one finished; each failure has its own code
 * @param data the code, the new password and its confirmation
 * @param token the token from the url
 * @param callbackUrl carried to the login (allow-listed only)
 */
export const verifyReset = async (
  data: z.infer<typeof ResetSchema>,
  token: string,
  callbackUrl?: string,
): Promise<OtpFailure> => {
  // reset fields { newpassword, confirmphone, phone}
  const validatedFields = ResetSchema.safeParse(data);

  if (!validatedFields.success)
    // will not reach this so no need but keep fo unsuring
    return otpFailure("invalid", "برجاء ادخال جميع البيانات");

  // get data
  const { otp, newpassword, confirmpassword } = validatedFields.data;

  // if password doesnot match
  if (newpassword !== confirmpassword)
    return otpFailure("invalid", "كلمة المرور غير مطابقة");

  try {
    const attempt = await readOtpAttempt(token, otp);
    if (attempt.kind === "failure") return attempt.failure;

    // a code another submit already used: that one saved the password, go on to the login
    if (attempt.kind === "valid") {
      // bcrypt hasing (saved trimmed)
      const hashedPassword = await hashWebsitePassword(newpassword);
      await completePasswordReset(attempt.id, attempt.phone, hashedPassword);
    }
  } catch (error) {
    console.error("[otp] reset failed", error);
    return otpFailure("server_error");
  }

  // redirect to login page
  redirect(withCallbackUrl("/login", callbackUrl));
};
