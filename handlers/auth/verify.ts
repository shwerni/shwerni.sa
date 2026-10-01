import "server-only";
// React & Next
import { redirect } from "next/navigation";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// database data
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

// utils
import { maskPhone } from "@/utils/phone";

// prisma types

export const checkToken = async (token: string) => {
  // check if token exist
  const tokenExist = await getVerificationTokenByToken(token);

  //   if token not exist
  if (!tokenExist)
    return { state: false, message: "لا يوجد كود تفعيل لهذا الحساب" };

  // token expired
  if (new Date(tokenExist.expire) < new Date())
    return { state: false, message: "انتهت صلاحية كود التحقق" };

  // user exist
  const user = await getUserByPhone(tokenExist.phone);

  // if user not exist
  if (!user) return { state: false, message: "لا يوجد حساب بهذا الرقم" };

  // check if blocked
  const isBLocked = await CheckIsBlocked(tokenExist.phone);

  // vakidate
  if (isBLocked) return { state: false, message: "هذا الحساب محظور" };

  // the token is in the url, so only a masked phone goes back; never the otp
  return { phone: maskPhone(tokenExist.phone) };
};

// after submiting the otp and checking all condations of the verification token with checkToken function
export const verifyToken = async (token: string, otp: string) => {
  try {
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

    // update user phone verified to true
    const user = await prisma.user.update({
      where: { id: userExist?.id },
      data: {
        phoneVerified: new Date(),
        phone,
      },
    });

    // if owner update phone number
    if (user.role == UserRole.OWNER) {
      await prisma.consultant.update({
        where: { userId: userExist?.id },
        data: {
          phone,
        },
      });
    }

    // return { state: true, message: "تم التحقق بنجاح" };
  } catch (error) {
    // error
    return { state: false, message: "حدث خطأ ما في الصفحة" };
  }
  // redirect
  redirect(`/login`);
};

// after submiting the otp and checking all condations of the verification token with checkToken function
export const phoneToken = async (phone: string) => {
  // generate one
  const verificationToken = await generateVerificationToken(phone);

  // redirect
  redirect(`/verify-otp?token=${verificationToken?.token}`);
};
