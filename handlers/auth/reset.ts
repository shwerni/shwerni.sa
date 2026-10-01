import "server-only";
// React & Next
import { redirect } from "next/navigation";

// prisma db
import prisma from "@/lib/database/db";

// packages
import { z } from "zod";
import bcrypt from "bcryptjs";

// schemas
import { PhoneSchema, ResetSchema } from "@/schemas";

// lib
import { notificationSecurityOtp } from "@/lib/notifications/site";

// prisma data
import {
  MAX_OTP_ATTEMPTS,
  consumeVerificationAttempt,
  deleteVerificationToken,
  generateVerificationToken,
  getVerificationTokenByToken,
  otpMatches,
} from "@/data/verificationTokens";
import { getUserByPhone } from "@/data/user";
import { CheckIsBlocked } from "@/data/blocked";

export const forgetpassowrd = async (data: z.infer<typeof PhoneSchema>) => {
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
  redirect(`/reset-password?token=${verificationToken?.token}`);
};

// after submiting the otp and checking all condations of the verification token with checkToken function
export const verifyReset = async (
  data: z.infer<typeof ResetSchema>,
  token: string,
) => {
  // reset fields { newpassword, confirmphone, phone}
  const validatedFields = ResetSchema.safeParse(data);

  if (!validatedFields.success)
    // will not reach this so no need but keep fo unsuring
    return { state: false, message: "برجاء ادخال جميع البيانات" };

  // get data
  const { otp, newpassword, confirmpassword } = validatedFields.data;

  // if password doesnot match
  if (newpassword !== confirmpassword)
    return { state: false, message: "كلمة المرور غير مطابقة" };

  // counts this attempt and reads the token in one query (only a live, unexpired token)
  const tokenExist = await consumeVerificationAttempt(token);

  // missing or expired token: same messages as before
  if (!tokenExist) {
    const expired = await getVerificationTokenByToken(token);
    return expired
      ? { state: false, message: "انتهت صلاحية كود التحقق" }
      : { state: false, message: "لا يوجد كود تفعيل لهذا الحساب" };
  }

  // phone of this token, never from the client
  const phone = tokenExist.phone;

  // if otp is not matched
  if (!otpMatches(tokenExist.otp, otp)) {
    // too many wrong tries: the user must request a new code
    if (tokenExist.attempts >= MAX_OTP_ATTEMPTS) {
      await deleteVerificationToken(tokenExist.id);
      return { state: false, message: "انتهت صلاحية كود التحقق" };
    }
    return { state: false, message: "رمز التحقق خطأ" };
  }

  // single use: the token goes before anything else happens
  await deleteVerificationToken(tokenExist.id);

  // user exist
  const userExist = await getUserByPhone(phone);

  // bcrypt hasing
  const hashedPassword = await bcrypt.hash(newpassword, 10);

  // update user phone verified to true
  await prisma.user.update({
    where: { id: userExist?.id },
    data: {
      phoneVerified: new Date(),
      phone: phone,
      password: hashedPassword,
    },
  });

  // redirect to login page
  redirect("/login");
};
