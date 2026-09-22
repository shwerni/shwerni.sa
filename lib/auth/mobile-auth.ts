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

// true when the request updates the phone of the signed in user
const isPhoneChange = (ctx: { path?: string; body?: unknown }) =>
  ctx.path === "/phone-number/verify" &&
  (ctx.body as { updatePhoneNumber?: boolean } | undefined)
    ?.updatePhoneNumber === true;

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
        before: async (user) => {
          const allowedRoles = ["USER", "OWNER"];
          const role = allowedRoles.includes(
            (user as { role?: string }).role ?? "",
          )
            ? (user as { role?: string }).role
            : "USER";

          return { data: { ...user, role } };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: false,
  },

  user: {
    modelName: "User",
    fields: {
      emailVerified: "mobileEmailVerified",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: true,
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

      const { phoneNumber, newPassword } = ctx.body as {
        phoneNumber: string;
        newPassword: string;
      };

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { phone: phoneNumber },
        data: { password: hashedPassword },
      });
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
