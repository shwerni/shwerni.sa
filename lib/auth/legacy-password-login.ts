// packages
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import type { BetterAuthPlugin } from "better-auth";
import bcrypt from "bcryptjs";

// utils
import prisma from "../database/db";

/**
 * one-time bridge for existing web accounts logging into mobile for the
 * first time — verifies the legacy bcrypt password, then silently creates
 * both a better auth session and the mobile credential row, no otp needed
 * since the password itself already proves ownership
 */
export const legacyPasswordLogin = () => {
  return {
    id: "legacy-password-login",
    endpoints: {
      signInLegacyPassword: createAuthEndpoint(
        "/sign-in/legacy-password",
        {
          method: "POST",
          body: z.object({
            phone: z.string(),
            password: z.string(),
          }),
        },
        async (ctx) => {
          const { phone, password } = ctx.body;

          const user = await prisma.user.findUnique({ where: { phone } });

          if (!user?.password || !user.phoneVerified) {
            throw ctx.error("UNAUTHORIZED", { message: "بيانات الدخول غير صحيحة" });
          }

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            throw ctx.error("UNAUTHORIZED", { message: "بيانات الدخول غير صحيحة" });
          }

          const existingCredential = await prisma.mobileAccount.findFirst({
            where: { userId: user.id, providerId: "credential" },
          });
          if (existingCredential) {
            throw ctx.error("BAD_REQUEST", { message: "يرجى استخدام تسجيل الدخول العادي" });
          }

          const session = await ctx.context.internalAdapter.createSession(user.id, false);

          // reshaped to match better auth's own user type — camelCase timestamps,
          // non-null email, boolean emailVerified — not the raw prisma row
          const sessionUser = {
            id: user.id,
            name: user.name ?? "",
            email: user.email ?? `${user.phone}@shwerni.local`,
            emailVerified: user.mobileEmailVerified,
            image: user.image,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          };

          await setSessionCookie(ctx, { session, user: sessionUser });

          const hashedPassword = await ctx.context.password.hash(password);
          await prisma.mobileAccount.create({
            data: {
              userId: user.id,
              accountId: user.id,
              providerId: "credential",
              password: hashedPassword,
            },
          });

          return ctx.json({ user: sessionUser, session });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
};