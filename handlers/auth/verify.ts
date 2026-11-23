import "server-only";
// React & Next
import { redirect } from "next/navigation";

// database data
import {
  completePhoneVerification,
  generateVerificationToken,
  getVerificationTokenByToken,
} from "@/data/verificationTokens";

// handlers
import { otpFailure, readOtpAttempt, type OtpFailure } from "@/handlers/auth/otp";
import { getUserByPhone } from "@/data/user";
import { CheckIsBlocked } from "@/data/blocked";

// utils
import { maskPhone } from "@/utils/phone";

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

/**
 * the sign-up / login otp. one try of the code, then the token is claimed and the phone verified
 * in one transaction (completePhoneVerification). a second submit of a code this flow already
 * used (double tap, another tab) continues to the login when the phone is verified, instead of
 * "wrong code". each failure has its own code and message (OtpFailure)
 * @param token the token from the url
 * @param otp the code the user typed
 */
export const verifyToken = async (token: string, otp: string): Promise<OtpFailure> => {
  try {
    const attempt = await readOtpAttempt(token, otp);
    if (attempt.kind === "failure") return attempt.failure;

    const done =
      attempt.kind === "valid"
        ? await completePhoneVerification(attempt.id, attempt.phone)
        : "taken";

    // the code was used by another submit: fine when that one verified the phone
    if (done === "taken") {
      const phone =
        attempt.kind === "used" ? attempt.phone : (await getVerificationTokenByToken(token))?.phone;
      const user = phone ? await getUserByPhone(phone) : null;
      if (!user?.phoneVerified) return otpFailure("used");
    }
  } catch (error) {
    console.error("[otp] verify failed", error);
    return otpFailure("server_error");
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
