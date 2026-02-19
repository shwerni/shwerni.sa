// packages
import bcrypt from "bcryptjs";

// next auth
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// schemas
import { LogInSchema } from "@/schemas";

// data
import { getUserByPhone } from "@/data/user";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LogInSchema.safeParse(credentials);

        if (!validatedFields.success) return null;

        const { phone, password } = validatedFields.data;

        const user = await getUserByPhone(phone);

        if (!user || !user.password || !user.phone) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);

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
