import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      role: UserRole;
    } & DefaultSession["user"];
    // the login time (ms), checked against passwordChangedAt (lib/auth/server.ts)
    authAt?: number;
  }

  interface User extends DefaultUser {
    phone: string;
    role: UserRole;
    phoneVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone: string;
    role: UserRole;
    // the login time (ms), kept when the token is re-issued (auth.ts jwt callback)
    authAt?: number;
  }
}
