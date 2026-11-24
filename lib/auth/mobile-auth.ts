// packages
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";

// utils
import prisma from "../database/db";
import { notificationSecurityOtp } from "../notifications/site";
import { legacyPasswordLogin } from "./legacy-password-login";
import { cooldownDays, cooldownMessage } from "@/utils/user";

// prisma data
import { savePasswordChange } from "@/data/password-change";

// true when the request updates the phone of the signed in user
const isPhoneChange = (ctx: { path?: string; body?: unknown }) =>
  ctx.path === "/phone-number/verify" &&
  (ctx.body as { updatePhoneNumber?: boolean } | undefined)
    ?.updatePhoneNumber === true;

// /phone-number/reset-password answers { status: true } only after the otp was checked and the
// app's password saved; anything else (an APIError) is a failed reset
export const isSuccessfulReset = (returned: unknown) =>
  !(returned instanceof APIError) &&
  (returned as { status?: unknown } | null | undefined)?.status === true;

// the website's "phone verified" (User.phoneVerified, a date) follows better-auth's own
// phoneNumberVerified (User.mobilePhoneVerified), so a phone verified in the app counts on the
// website too (next-auth's signIn, the user pages, the legacy password login). the hooks get
// better-auth's logical field names (phoneNumber = User.phone)
type UserWrite = Record<string, unknown>;
type HookContext = { body?: unknown } | null | undefined;

/**
 * the phoneVerified stamp for a user write, or null for none: when phoneNumberVerified becomes
 * true, a new phone (sign-up, or a phone change) is verified now; an existing phone verified again
 * (an OTP login) is stamped only while the website's flag is empty, never moved
 * @param data the write, as better-auth hands it to the hook
 * @param ctx the endpoint context (its body names the phone being verified)
 */
const phoneVerifiedStamp = async (
  data: UserWrite,
  ctx: HookContext,
): Promise<{ phoneVerified: Date } | null> => {
  if (data.phoneNumberVerified !== true) return null;

  // a sign-up or a phone change: the phone in this write is the one just verified
  if (typeof data.phoneNumber === "string" && data.phoneNumber) {
    return { phoneVerified: new Date() };
  }

  // an existing account verifying its own phone: only fill an empty flag
  const phone = (ctx?.body as { phoneNumber?: unknown } | undefined)?.phoneNumber;
  if (typeof phone !== "string" || !phone) return null;
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { phoneVerified: true },
  });
  return user && !user.phoneVerified ? { phoneVerified: new Date() } : null;
};

/**
 * isolated better auth instance for the mobile app
 * shares user identity (phone/email) with the web next-auth flow,
 * but writes to its own session/account/verification tables
 */
export const mobileAuth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/mobile/auth",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          const allowedRoles = ["USER", "OWNER"];
          const role = allowedRoles.includes(
            (user as { role?: string }).role ?? "",
          )
            ? (user as { role?: string }).role
            : "USER";

          // sign-up on otp verification: the website's flag too
          const stamp = await phoneVerifiedStamp(user as UserWrite, ctx);

          return { data: { ...user, role, ...stamp } };
        },
      },
      update: {
        // role is an input field only so sign-up can pick USER or OWNER;
        // no client update (e.g. /update-user) may change it afterwards
        before: async (data, ctx) => {
          if ("role" in data)
            throw new APIError("BAD_REQUEST", {
              message: "role is not allowed to be set",
            });

          // an otp login or a phone change: the website's flag too
          const stamp = await phoneVerifiedStamp(data as UserWrite, ctx);
          if (stamp) return { data: { ...data, ...stamp } };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: false,
  },

  user: {
    modelName: "User",
    // better-auth's user fields → our User columns (Prisma refuses any name the model lacks).
    // phoneNumberVerified → mobilePhoneVerified is mapped in the phoneNumber plugin's schema below
    fields: {
      emailVerified: "mobileEmailVerified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: true,
      },
      // the website's "phone verified" date, written only by the hooks above (never from input)
      phoneVerified: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  session: {
    modelName: "MobileSession",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  account: {
    modelName: "MobileAccount",
  },
  verification: {
    modelName: "MobileVerification",
  },
  hooks: {
    // block phone changes during the cooldown
    before: createAuthMiddleware(async (ctx) => {
      if (!isPhoneChange(ctx)) return;

      const session = await getSessionFromCtx(ctx);
      // unauthenticated calls are rejected by the endpoint itself
      if (!session) return;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phoneChangedAt: true },
      });

      const days = cooldownDays(user?.phoneChangedAt ?? null);
      if (days > 0) {
        throw new APIError("FORBIDDEN", {
          message: cooldownMessage("رقم الجوال", days),
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (isPhoneChange(ctx)) {
        // failed verification (wrong otp, number taken) must not start the cooldown
        if (ctx.context.returned instanceof APIError) return;

        const session = await getSessionFromCtx(ctx);
        if (!session) return;

        const { phoneNumber: next } = ctx.body as { phoneNumber: string };
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { phone: true },
        });

        // stamp only when the phone really changed
        if (user?.phone === next) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { phoneChangedAt: new Date() },
          });
        }
        return;
      }

      if (ctx.path !== "/phone-number/reset-password") return;

      // after hooks run on failures too (a wrong, expired or missing otp returns its APIError
      // here): the website password follows only a reset that succeeded
      if (!isSuccessfulReset(ctx.context.returned)) return;

      const { phoneNumber, newPassword } = ctx.body as {
        phoneNumber: string;
        newPassword: string;
      };

      const user = await prisma.user.findUnique({
        where: { phone: phoneNumber },
        select: { id: true },
      });
      if (!user) return;

      // an app that is logged in into this same account keeps its session; every other app
      // session ends, and website logins from before the reset are refused
      const current = await getSessionFromCtx(ctx).catch(() => null);
      const keep = current?.user.id === user.id ? current.session.id : undefined;

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await savePasswordChange(user.id, hashedPassword, keep);
    }),
  },
  plugins: [
    legacyPasswordLogin(),
    phoneNumber({
      otpLength: 5,
      expiresIn: 60 * 5,
      schema: {
        user: {
          modelName: "User",
          fields: {
            phoneNumber: "phone",
            phoneNumberVerified: "mobilePhoneVerified",
          },
        },
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${phoneNumber}@shwerni.local`,
      },
      sendOTP: async ({ phoneNumber, code }) => {
        const existingUser = await prisma.user.findUnique({
          where: { phone: phoneNumber },
          select: { name: true },
        });

        await notificationSecurityOtp(
          phoneNumber,
          existingUser?.name || "",
          code,
        );
      },
      sendPasswordResetOTP: async ({ phoneNumber, code }) => {
        const existingUser = await prisma.user.findUnique({
          where: { phone: phoneNumber },
          select: { name: true },
        });

        await notificationSecurityOtp(
          phoneNumber,
          existingUser?.name || "",
          code,
        );
      },
    }),
  ],

  trustedOrigins: [
    "shwerni://",
    "exp://",
    "http://192.168.1.4:3000",
    "http://localhost:3000",
  ],
});
