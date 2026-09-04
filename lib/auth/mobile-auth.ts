// packages
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";

// utils
import prisma from "../database/db";
import { notificationSecurityOtp } from "../notifications/site";
import { legacyPasswordLogin } from "./legacy-password-login";

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
    after: createAuthMiddleware(async (ctx) => {
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
