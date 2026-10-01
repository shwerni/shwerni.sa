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
  // log mode: records the botid verdict, never blocks
  await checkHuman("login");
  return loginHandler(...args);
}

// public: account creation, then otp
export async function register(...args: Parameters<typeof registerHandler>) {
  // log mode: records the botid verdict, never blocks
  await checkHuman("register");
  return registerHandler(...args);
}

// public: sends a reset otp
export async function forgetpassowrd(
  ...args: Parameters<typeof forgetpassowrdHandler>
) {
  // log mode: records the botid verdict, never blocks
  await checkHuman("forgetpassowrd");
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
  // log mode: records the botid verdict, never blocks
  await checkHuman("phoneToken");
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
  // log mode: records the botid verdict, never blocks
  await checkHuman("unauthorizedPhoneChangeByToken");
  return unauthorizedPhoneChangeByTokenHandler(...args);
}
