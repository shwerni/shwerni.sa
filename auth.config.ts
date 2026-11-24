// next auth
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// schemas
import { LogInSchema } from "@/schemas";

// data
import { getUserByPhone } from "@/data/user";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { matchesWebsitePassword } from "@/lib/auth/password";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        // a bot gets null, the same as wrong credentials. covers direct posts to
        // /api/auth/callback/credentials, which skip the login action
        if (!(await checkHuman("nextauth-credentials"))) return null;

        const validatedFields = LogInSchema.safeParse(credentials);

        if (!validatedFields.success) return null;

        const { phone, password } = validatedFields.data;

        const user = await getUserByPhone(phone);

        if (!user || !user.password || !user.phone) return null;

        // the trimmed password, then (for one saved with its spaces) exactly as typed: the schema
        // already trimmed `password`, so the typed one comes from the raw credentials
        const typed =
          typeof credentials?.password === "string" ? credentials.password : password;
        const passwordMatch = await matchesWebsitePassword(typed, user.password);

        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name ?? undefined,
          phone: user.phone,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
