import "server-only";

// prisma data
import {
  MAX_OTP_ATTEMPTS,
  consumeVerificationAttempt,
  deleteVerificationToken,
  getUsedVerificationToken,
  getVerificationTokenByToken,
  otpMatches,
} from "@/data/verificationTokens";

// every otp failure has its own code, so the page shows the right message (before, the forms
// showed "wrong code" for all of them, an expired code and a server error included)
export type OtpCode =
  | "wrong_code"
  | "expired"
  | "too_many"
  | "no_token"
  | "used"
  | "invalid"
  | "server_error";

export type OtpFailure = { state: false; code: OtpCode; message: string };

const MESSAGES: Record<Exclude<OtpCode, "invalid">, string> = {
  wrong_code: "رمز التحقق خطأ",
  expired: "انتهت صلاحية كود التحقق",
  too_many: "تم تجاوز عدد المحاولات، برجاء طلب رمز جديد",
  no_token: "لا يوجد كود تفعيل لهذا الحساب",
  used: "تم استخدام هذا الرمز بالفعل، برجاء طلب رمز جديد",
  server_error: "حدث خطأ ما في الصفحة",
};

/**
 * a failure answer
 * @param code the failure
 * @param message the message, for "invalid" (the form's own validation messages)
 */
export const otpFailure = (code: OtpCode, message?: string): OtpFailure => ({
  state: false,
  code,
  message: message ?? (code === "invalid" ? MESSAGES.server_error : MESSAGES[code]),
});

export type OtpAttempt =
  | { kind: "valid"; id: string; phone: string }
  | { kind: "used"; phone: string }
  | { kind: "failure"; failure: OtpFailure };

/**
 * one try of a code (counted, constant-time compare, 5 wrong tries delete the token):
 * - valid: the code matches a live token (the caller claims it in its transaction)
 * - used: this token was already used in this flow (a second submit, another tab): the caller
 *   continues the flow when the first one finished it
 * - failure: wrong code, expired, too many tries, or no such code
 * @param token the token from the url
 * @param otp the code the user typed
 */
export async function readOtpAttempt(token: unknown, otp: unknown): Promise<OtpAttempt> {
  if (typeof token !== "string" || !token) return { kind: "failure", failure: otpFailure("no_token") };

  // counts this attempt and reads the token in one query (only a live, unexpired, unused token)
  const row = await consumeVerificationAttempt(token);

  if (!row) {
    const used = await getUsedVerificationToken(token);
    if (used) return { kind: "used", phone: used.phone };

    const exists = await getVerificationTokenByToken(token);
    return { kind: "failure", failure: otpFailure(exists ? "expired" : "no_token") };
  }

  if (!otpMatches(row.otp, String(otp ?? ""))) {
    // too many wrong tries: the user must request a new code
    if (row.attempts >= MAX_OTP_ATTEMPTS) {
      await deleteVerificationToken(row.id);
      return { kind: "failure", failure: otpFailure("too_many") };
    }
    return { kind: "failure", failure: otpFailure("wrong_code") };
  }

  return { kind: "valid", id: row.id, phone: row.phone };
}
