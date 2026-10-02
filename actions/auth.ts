"use server";

// hotfix wrappers: same signatures and return shapes as handlers/auth, which are now server-only.
// the handlers already check the session / token themselves (tier 1).

// prisma data
import { login as loginHandler } from "@/handlers/auth/login";
import { register as registerHandler } from "@/handlers/auth/register";
import {
  forgetpassowrd as forgetpassowrdHandler,
  verifyReset as verifyResetHandler,
} from "@/handlers/auth/reset";
import {
  unauthorizedPhoneChangeByToken as unauthorizedPhoneChangeByTokenHandler,
  userInfoChange as userInfoChangeHandler,
  userPasswrodChange as userPasswrodChangeHandler,
} from "@/handlers/auth/userInfo";
import {
  phoneToken as phoneTokenHandler,
  verifyToken as verifyTokenHandler,
} from "@/handlers/auth/verify";

// lib
import { checkHuman } from "@/lib/bot-protection";

// public: credentials check
export async function login(...args: Parameters<typeof loginHandler>) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("login"))) return { state: false, message: "حدث حطأ ما" };
  return loginHandler(...args);
}

// public: account creation, then otp
export async function register(...args: Parameters<typeof registerHandler>) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("register"))) return { state: false, message: "حدث حطأ ما" };
  return registerHandler(...args);
}

// public: sends a reset otp
export async function forgetpassowrd(
  ...args: Parameters<typeof forgetpassowrdHandler>
) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("forgetpassowrd"))) return { state: false, message: "حدث خطأ ما برجاء اعادة المحاولة" };
  return forgetpassowrdHandler(...args);
}

// public: token + otp
export async function verifyReset(
  ...args: Parameters<typeof verifyResetHandler>
) {
  return verifyResetHandler(...args);
}

// public: token + otp
export async function verifyToken(
  ...args: Parameters<typeof verifyTokenHandler>
) {
  return verifyTokenHandler(...args);
}

// public: sends a verification otp
export async function phoneToken(
  ...args: Parameters<typeof phoneTokenHandler>
) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("phoneToken"))) return;
  return phoneTokenHandler(...args);
}

// session user only (checked in the handler)
export async function userInfoChange(
  ...args: Parameters<typeof userInfoChangeHandler>
) {
  return userInfoChangeHandler(...args);
}

// session user only (checked in the handler)
export async function userPasswrodChange(
  ...args: Parameters<typeof userPasswrodChangeHandler>
) {
  return userPasswrodChangeHandler(...args);
}

// session user only (checked in the handler)
export async function unauthorizedPhoneChangeByToken(
  ...args: Parameters<typeof unauthorizedPhoneChangeByTokenHandler>
) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("unauthorizedPhoneChangeByToken"))) return { state: false, message: "حدث حطأ ما" };
  return unauthorizedPhoneChangeByTokenHandler(...args);
}
