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

      return session;
    },
    async jwt({ token }) {
      // if not signed do nothing
      if (!token.sub) return token;

      // get user by id
      const user = await getUserById(token.sub);

      // validate
      if (!user) return token;

      // add phone and role to the token
      token.phone = user.phone;
      token.role = user.role;

      return token;
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  ...authConfig,
});
