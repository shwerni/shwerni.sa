// prisma db
import { PrismaAdapter } from "@auth/prisma-adapter";

// next auth packages
import NextAuth from "next-auth";

// next auth config
import authConfig from "@/auth.config";

// primsa
import prisma from "@/lib/database/db";
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma  data
import { getUserById, getUserByPhone } from "@/data/user";

// constants
import { SESSION_MAX_AGE_SECONDS } from "@/constants/session";

// utils
import { loginTime } from "@/utils/login-time";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/login",
    error: "/notfound",
  },
  callbacks: {
    async signIn({ user }) {
      // validate
      if (!user.phone) return false;

      // user exist
      const userExist = await getUserByPhone(user.phone);
      // if phone is not verified
      if (!userExist?.phoneVerified) return false;
      // return true log in success
      return true;
    },
    async session({ token, session }) {
      // validate
      if (!session.user || !token.sub) return session;

      // add user id to the session
      session.user.id = token.sub;

      if (token.phone)
        // phone
        session.user.phone = token.phone as string;

      if (token.role)
        // role
        session.user.role = token.role as UserRole;

      // the login time, for the password-change check in userServer
      session.authAt = loginTime(token);

      return session;
    },
    async jwt({ token }) {
      // if not signed do nothing
      if (!token.sub) return token;

      // the login time (ms). set at the login and kept as the token is re-issued (a re-issue gets
      // a new iat), so a password change signs out every login from before it. a token from
      // before this claim keeps its issue time
      if (typeof token.authAt !== "number")
        token.authAt = loginTime(token) ?? Date.now();

      // validate
      if (token.phone && token.role) return token;
      
      
      // get user by id
      const user = await getUserById(token.sub);

      // validate
      if (!user) return token;

      // add phone and role to the token
      token.phone = user.phone ?? "";
      token.role = user.role;

      return token;
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  // 90 days from the login (the token and the cookie); see constants/session.ts
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  ...authConfig,
});
